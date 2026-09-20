'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, initCinetPayPayment } from '@/lib/cinetpay';
import { PREMIUM_PRICE_FCFA } from '@/lib/premium';
import type { PremiumSubscription, UserProfile } from '@/lib/types';

export type InitiatePremiumSubscriptionPaymentResult =
  | { success: true; paymentUrl: string }
  | { success: false; error: string };

function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:9005';
}

/**
 * Ouvre une session de paiement CinetPay pour un abonnement Premium déjà
 * créé en base (`paiement.statut === 'en_attente'`). Même schéma que
 * `initiateMobileMoneyPaymentAction` pour les commandes, mais pointe vers
 * un `notify_url` dédié (`/api/webhooks/cinetpay/premium`) puisqu'un
 * abonnement n'est pas une commande — pas de restaurant, pas de livreur.
 */
export async function initiatePremiumSubscriptionPaymentAction(
  subscriptionId: string,
  idToken: string,
): Promise<InitiatePremiumSubscriptionPaymentResult> {
  if (!subscriptionId || !idToken) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  const cinetpayConfig = getCinetPayConfig();
  if (!cinetpayConfig) {
    return {
      success: false,
      error: "L'abonnement Premium n'est pas encore disponible.",
    };
  }

  const adminDb = getAdminDb();

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('initiatePremiumSubscriptionPaymentAction: token invalide', err);
    return { success: false, error: 'Authentification invalide.' };
  }

  const subscriptionRef = adminDb.collection('abonnements').doc(subscriptionId);
  const snap = await subscriptionRef.get();
  if (!snap.exists) {
    return { success: false, error: 'Abonnement introuvable.' };
  }
  const subscription = { id: snap.id, ...(snap.data() as Omit<PremiumSubscription, 'id'>) };

  if (subscription.userId !== uid) {
    return { success: false, error: 'Accès refusé.' };
  }
  if (subscription.paiement.statut === 'paye') {
    return { success: false, error: 'Cet abonnement est déjà payé.' };
  }
  // Défense en profondeur : même si firestore.rules verrouille déjà
  // `montant` à la constante serveur, on ne fait jamais confiance à la
  // valeur du document pour l'appel CinetPay — seule la constante compte.
  if (subscription.montant !== PREMIUM_PRICE_FCFA) {
    console.error('initiatePremiumSubscriptionPaymentAction: montant inattendu', subscription.id, subscription.montant);
    return { success: false, error: 'Abonnement invalide.' };
  }

  const userSnap = await adminDb.collection('utilisateurs').doc(uid).get();
  const userProfile = userSnap.data() as UserProfile | undefined;

  const baseUrl = getAppBaseUrl();
  const transactionId = `${subscriptionId}-${Date.now()}`;

  const result = await initCinetPayPayment(cinetpayConfig, {
    transactionId,
    amount: PREMIUM_PRICE_FCFA,
    description: 'Abonnement Premium Yakro Fê — 30 jours',
    notifyUrl: `${baseUrl}/api/webhooks/cinetpay/premium`,
    returnUrl: `${baseUrl}/profile`,
    customer: {
      phoneNumber: userProfile?.telephone,
      address: userProfile?.adresseParDefaut,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Une entrée dédiée, indexée par transactionId, plutôt qu'un simple champ
  // écrasé sur l'abonnement : si le client relance une tentative (nouveau
  // transactionId), l'ancienne entrée reste résolvable si CinetPay finit
  // par confirmer le paiement initial en retard — sans ça, le webhook ne
  // retrouverait plus l'abonnement (champ déjà écrasé) et le paiement
  // resterait encaissé par CinetPay sans jamais être crédité.
  await adminDb.collection('payment_transactions').doc(transactionId).set({
    collection: 'abonnements',
    docId: subscriptionId,
    createdAt: new Date().toISOString(),
  });

  await subscriptionRef.update({
    'paiement.transactionId': transactionId,
    'paiement.paymentToken': result.data.paymentToken,
  });

  return { success: true, paymentUrl: result.data.paymentUrl };
}
