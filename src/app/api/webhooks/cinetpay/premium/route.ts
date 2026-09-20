import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, checkCinetPayPaymentStatus } from '@/lib/cinetpay';
import { computeNewPremiumExpiry, PREMIUM_PRICE_FCFA } from '@/lib/premium';
import type { PremiumSubscription, UserProfile } from '@/lib/types';

/**
 * Webhook CinetPay dédié aux abonnements Premium (`notify_url` distinct de
 * celui des commandes — CinetPay l'accepte par transaction à
 * l'initialisation). Même règle de sécurité non négociable que le webhook
 * commandes : on ne fait jamais confiance au contenu du webhook lui-même,
 * seul l'appel `/v2/payment/check` fait foi.
 */
export async function POST(request: Request) {
  const cinetpayConfig = getCinetPayConfig();
  if (!cinetpayConfig) {
    console.error('cinetpay premium webhook: reçu alors que CINETPAY_API_KEY/SITE_ID ne sont pas configurés');
    return NextResponse.json({ error: 'Non configuré' }, { status: 500 });
  }

  let transactionId: string | null = null;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      transactionId = body.cpm_trans_id || body.transaction_id || null;
    } else {
      const form = await request.formData();
      transactionId = (form.get('cpm_trans_id') || form.get('transaction_id'))?.toString() ?? null;
    }
  } catch (error) {
    console.error('cinetpay premium webhook: corps de requête illisible', error);
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  if (!transactionId) {
    return NextResponse.json({ error: 'cpm_trans_id manquant' }, { status: 400 });
  }

  const verification = await checkCinetPayPaymentStatus(cinetpayConfig, transactionId);
  if (!verification.success) {
    console.error('cinetpay premium webhook: échec de vérification', transactionId, verification.error);
    return NextResponse.json({ error: verification.error }, { status: 500 });
  }

  const adminDb = getAdminDb();

  // Résolution par la table dédiée `payment_transactions` — voir le webhook
  // commandes pour le détail du problème que ça évite (paiement confirmé
  // en retard mais champ transactionId déjà écrasé par une nouvelle
  // tentative).
  const mappingSnap = await adminDb.collection('payment_transactions').doc(transactionId).get();
  let subscriptionRef = mappingSnap.exists && mappingSnap.data()?.collection === 'abonnements'
    ? adminDb.collection('abonnements').doc(mappingSnap.data()!.docId as string)
    : null;

  if (!subscriptionRef) {
    const querySnap = await adminDb
      .collection('abonnements')
      .where('paiement.transactionId', '==', transactionId)
      .limit(1)
      .get();
    subscriptionRef = querySnap.empty ? null : querySnap.docs[0].ref;
  }

  if (!subscriptionRef) {
    console.error('cinetpay premium webhook: aucun abonnement pour transaction_id', transactionId);
    return NextResponse.json({ received: true, matched: false });
  }

  const subscriptionSnap = await subscriptionRef.get();
  if (!subscriptionSnap.exists) {
    console.error('cinetpay premium webhook: abonnement référencé introuvable', transactionId);
    return NextResponse.json({ received: true, matched: false });
  }
  const subscription = subscriptionSnap.data() as PremiumSubscription;

  // Idempotence : un statut déjà final n'est plus modifié.
  if (subscription.paiement.statut === 'paye' || subscription.paiement.statut === 'echoue') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const { status, amount } = verification.data;

  // Le montant confirmé par CinetPay doit correspondre au prix Premium
  // officiel — jamais à ce que l'abonnement prétend, même si les rules et
  // l'action de paiement le verrouillent déjà en amont.
  if (status === 'ACCEPTED' && amount !== undefined && amount !== PREMIUM_PRICE_FCFA) {
    console.error('cinetpay premium webhook: montant confirmé différent du prix Premium', transactionId, { amount, attendu: PREMIUM_PRICE_FCFA });
    return NextResponse.json({ error: 'Montant incohérent' }, { status: 500 });
  }

  if (status === 'ACCEPTED') {
    const userRef = adminDb.collection('utilisateurs').doc(subscription.userId);
    const userSnap = await userRef.get();
    const userProfile = userSnap.data() as UserProfile | undefined;
    const newExpiry = computeNewPremiumExpiry(userProfile?.premiumJusquau, new Date(), subscription.dureeJours);

    const batch = adminDb.batch();
    batch.update(subscriptionRef, {
      'paiement.statut': 'paye',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
    batch.update(userRef, { premiumJusquau: Timestamp.fromDate(newExpiry) });
    await batch.commit();
  } else if (status === 'REFUSED' || status === 'EXPIRED') {
    await subscriptionRef.update({
      'paiement.statut': 'echoue',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
  }
  // PENDING / INITIATED / UNKNOWN : on ne touche à rien, on attend le
  // prochain appel du webhook.

  return NextResponse.json({ received: true, status });
}
