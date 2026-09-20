'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, initCinetPayPayment } from '@/lib/cinetpay';
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

  const userSnap = await adminDb.collection('utilisateurs').doc(uid).get();
  const userProfile = userSnap.data() as UserProfile | undefined;

  const baseUrl = getAppBaseUrl();
  const transactionId = `${subscriptionId}-${Date.now()}`;

  const result = await initCinetPayPayment(cinetpayConfig, {
    transactionId,
    amount: subscription.paiement.montant,
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

  await subscriptionRef.update({
    'paiement.transactionId': transactionId,
    'paiement.paymentToken': result.data.paymentToken,
  });

  return { success: true, paymentUrl: result.data.paymentUrl };
}
