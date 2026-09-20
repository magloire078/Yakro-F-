import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, checkCinetPayPaymentStatus } from '@/lib/cinetpay';
import { computeNewPremiumExpiry } from '@/lib/premium';
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
  const querySnap = await adminDb
    .collection('abonnements')
    .where('paiement.transactionId', '==', transactionId)
    .limit(1)
    .get();

  if (querySnap.empty) {
    console.error('cinetpay premium webhook: aucun abonnement pour transaction_id', transactionId);
    return NextResponse.json({ received: true, matched: false });
  }

  const subscriptionDoc = querySnap.docs[0];
  const subscription = subscriptionDoc.data() as PremiumSubscription;

  // Idempotence : un statut déjà final n'est plus modifié.
  if (subscription.paiement.statut === 'paye' || subscription.paiement.statut === 'echoue') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const { status } = verification.data;

  if (status === 'ACCEPTED') {
    const userRef = adminDb.collection('utilisateurs').doc(subscription.userId);
    const userSnap = await userRef.get();
    const userProfile = userSnap.data() as UserProfile | undefined;
    const newExpiry = computeNewPremiumExpiry(userProfile?.premiumJusquau, new Date(), subscription.dureeJours);

    const batch = adminDb.batch();
    batch.update(subscriptionDoc.ref, {
      'paiement.statut': 'paye',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
    batch.update(userRef, { premiumJusquau: Timestamp.fromDate(newExpiry) });
    await batch.commit();
  } else if (status === 'REFUSED' || status === 'EXPIRED') {
    await subscriptionDoc.ref.update({
      'paiement.statut': 'echoue',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
  }
  // PENDING / INITIATED / UNKNOWN : on ne touche à rien, on attend le
  // prochain appel du webhook.

  return NextResponse.json({ received: true, status });
}
