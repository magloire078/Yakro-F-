'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { getCinetPayConfig, initCinetPayPayment } from '@/lib/cinetpay';
import type { Order } from '@/lib/types';

export type InitiateMobileMoneyPaymentResult =
  | { success: true; paymentUrl: string }
  | { success: false; error: string };

/**
 * Résout l'URL de base de l'app pour construire `notify_url`/`return_url`.
 * Priorité : `NEXT_PUBLIC_APP_URL` (à définir explicitement en prod) →
 * `VERCEL_URL` (fourni automatiquement par Vercel au runtime, sans le
 * protocole) → localhost pour le dev.
 */
function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:9005';
}

/**
 * Ouvre une session de paiement CinetPay pour une commande déjà créée en
 * base (`paiement.statut === 'en_attente'`). Triggered par le client
 * juste après `placeOrder` lorsque le mode choisi est un opérateur
 * Mobile Money. Ré-authentifie l'appelant via son ID token (les rules
 * interdisent au client d'écrire sur `paiement`, donc cet appel passe
 * par l'Admin SDK après vérification).
 */
export async function initiateMobileMoneyPaymentAction(
  orderId: string,
  idToken: string,
): Promise<InitiateMobileMoneyPaymentResult> {
  if (!orderId || !idToken) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  const cinetpayConfig = getCinetPayConfig();
  if (!cinetpayConfig) {
    return {
      success: false,
      error: "Le paiement Mobile Money n'est pas encore disponible. Choisissez « Espèces à la livraison ».",
    };
  }

  const adminDb = getAdminDb();

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('initiateMobileMoneyPaymentAction: token invalide', err);
    return { success: false, error: 'Authentification invalide.' };
  }

  const orderRef = adminDb.collection('commandes').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) {
    return { success: false, error: 'Commande introuvable.' };
  }
  const order = { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };

  if (order.userId !== uid) {
    return { success: false, error: 'Accès refusé.' };
  }

  if (order.paiement.mode === 'especes') {
    return { success: false, error: 'Cette commande est réglée en espèces à la livraison.' };
  }

  if (order.paiement.statut === 'paye') {
    return { success: false, error: 'Cette commande est déjà payée.' };
  }

  const baseUrl = getAppBaseUrl();
  // Identifiant unique par TENTATIVE (pas juste par commande) : si le
  // client rate son paiement et réessaie, CinetPay refuse un
  // transaction_id déjà utilisé.
  const transactionId = `${orderId}-${Date.now()}`;

  const result = await initCinetPayPayment(cinetpayConfig, {
    transactionId,
    amount: order.paiement.montant,
    description: `Commande Yakro Fê — ${order.nomRestaurant}`,
    notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
    returnUrl: `${baseUrl}/orders/track?id=${orderId}`,
    customer: {
      phoneNumber: order.telephoneClient,
      address: order.adresseClient,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  await orderRef.update({
    'paiement.transactionId': transactionId,
    'paiement.paymentToken': result.data.paymentToken,
  });

  return { success: true, paymentUrl: result.data.paymentUrl };
}
