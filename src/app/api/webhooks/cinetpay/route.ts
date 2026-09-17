import { NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, checkCinetPayPaymentStatus } from '@/lib/cinetpay';
import type { Order } from '@/lib/types';

/**
 * Webhook CinetPay (`notify_url`). Appelé par CinetPay — pas par notre
 * app — à chaque changement de statut d'une transaction. Peut être
 * appelé plusieurs fois pour la même transaction (le traitement doit
 * être idempotent).
 *
 * Règle de sécurité non négociable : on ne fait JAMAIS confiance au
 * contenu du webhook lui-même (un tiers pourrait forger une requête
 * similaire). On extrait uniquement l'identifiant de transaction, puis
 * on interroge CinetPay via `/v2/payment/check` avec notre clé API pour
 * obtenir le VRAI statut avant de toucher à Firestore.
 *
 * CinetPay poste classiquement en `application/x-www-form-urlencoded`
 * avec un champ `cpm_trans_id`. On tente aussi le JSON par prudence.
 */
export async function POST(request: Request) {
  const cinetpayConfig = getCinetPayConfig();
  if (!cinetpayConfig) {
    console.error('cinetpay webhook: reçu alors que CINETPAY_API_KEY/SITE_ID ne sont pas configurés');
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
    console.error('cinetpay webhook: corps de requête illisible', error);
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  if (!transactionId) {
    return NextResponse.json({ error: 'cpm_trans_id manquant' }, { status: 400 });
  }

  const verification = await checkCinetPayPaymentStatus(cinetpayConfig, transactionId);
  if (!verification.success) {
    console.error('cinetpay webhook: échec de vérification', transactionId, verification.error);
    // 500 pour que CinetPay retente plus tard.
    return NextResponse.json({ error: verification.error }, { status: 500 });
  }

  const adminDb = getAdminDb();
  const querySnap = await adminDb
    .collection('commandes')
    .where('paiement.transactionId', '==', transactionId)
    .limit(1)
    .get();

  if (querySnap.empty) {
    console.error('cinetpay webhook: aucune commande pour transaction_id', transactionId);
    // 200 : ce n'est pas une erreur transitoire, retenter ne changera rien.
    return NextResponse.json({ received: true, matched: false });
  }

  const orderDoc = querySnap.docs[0];
  const order = orderDoc.data() as Order;

  // Idempotence : un statut déjà final n'est plus modifié.
  if (order.paiement.statut === 'paye' || order.paiement.statut === 'echoue') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const { status } = verification.data;

  if (status === 'ACCEPTED') {
    await orderDoc.ref.update({
      'paiement.statut': 'paye',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
  } else if (status === 'REFUSED' || status === 'EXPIRED') {
    await orderDoc.ref.update({
      'paiement.statut': 'echoue',
      'paiement.dateConfirmation': new Date().toISOString(),
    });
  }
  // PENDING / INITIATED / UNKNOWN : on ne touche à rien, on attend le
  // prochain appel du webhook.

  return NextResponse.json({ received: true, status });
}
