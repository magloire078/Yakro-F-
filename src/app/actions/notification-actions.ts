'use server';

import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { Order } from '@/lib/types';

export type NotifyNewOrderResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Emits a `NEW_ORDER` notification for the restaurateur whose restaurant
 * received the order. Triggered by the client right after `placeOrder`
 * succeeds; the rules forbid clients from creating /notifications, so
 * this runs server-side via the Admin SDK after re-verifying the caller.
 */
export async function notifyNewOrderAction(
  orderId: string,
  idToken: string,
): Promise<NotifyNewOrderResult> {
  if (!orderId || !idToken) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('notifyNewOrderAction: token invalide', err);
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
  if (!order.restaurateurId) {
    return { success: true };
  }

  await adminDb.collection('notifications').add({
    destinataireId: order.restaurateurId,
    type: 'NEW_ORDER',
    orderId: order.id,
    total: order.total,
    restaurantId: order.restaurantId,
    date: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });

  return { success: true };
}
