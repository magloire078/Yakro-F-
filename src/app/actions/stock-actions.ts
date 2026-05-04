'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import type { Order, StockItem } from '@/lib/types';
import { aggregateIngredientDeductions } from '@/lib/stock-utils';

export type ProcessDeliveredOrderResult =
  | { success: true; lowStockAlerts: number }
  | { success: false; error: string };

/**
 * Server-side, privileged completion path triggered after a livreur marks an
 * order delivered. The Firestore rules forbid the livreur from writing to
 * `/stocks` or to the restaurateur's `/notifications`, so we re-verify the
 * livreur's identity via their Firebase ID token and run the stock decrement
 * + low-stock alerting through the Admin SDK.
 */
export async function processDeliveredOrderAction(
  orderId: string,
  idToken: string,
): Promise<ProcessDeliveredOrderResult> {
  if (!orderId || !idToken) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('processDeliveredOrderAction: token invalide', err);
    return { success: false, error: 'Authentification invalide.' };
  }

  const db = getAdminDb();
  const orderRef = db.collection('commandes').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return { success: false, error: 'Commande introuvable.' };
  }
  const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, 'id'>) };

  if (order.statut !== 'Livrée') {
    return { success: false, error: 'La commande n\'est pas marquée Livrée.' };
  }

  const callerProfile = await db.collection('utilisateurs').doc(uid).get();
  const isSuperAdmin = callerProfile.exists
    && (callerProfile.data() as { roleSysteme?: string }).roleSysteme === 'SuperAdmin';

  if (order.livreurId !== uid && !isSuperAdmin) {
    return { success: false, error: 'Accès refusé.' };
  }

  const deductions = aggregateIngredientDeductions(order.plats);
  const stockItemIds = Object.keys(deductions);
  if (stockItemIds.length === 0) {
    return { success: true, lowStockAlerts: 0 };
  }

  // Read current state to detect threshold crossings.
  const stockSnaps = await db.getAll(
    ...stockItemIds.map((id) => db.collection('stocks').doc(id)),
  );

  const batch = db.batch();
  const now = new Date().toISOString();
  let lowStockAlerts = 0;

  for (const snap of stockSnaps) {
    if (!snap.exists) continue;
    const stock = snap.data() as StockItem;
    const delta = deductions[snap.id].quantite;
    const newQuantite = stock.quantite - delta;

    batch.update(snap.ref, {
      quantite: FieldValue.increment(-delta),
      derniereMiseAJour: now,
    });

    const wasAboveThreshold = stock.quantite > stock.seuilAlerte;
    const isAtOrBelowThreshold = newQuantite <= stock.seuilAlerte;
    if (wasAboveThreshold && isAtOrBelowThreshold && stock.restaurateurId) {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: stock.restaurateurId,
        type: 'STOCK_LOW',
        stockItemId: snap.id,
        stockItemNom: stock.nom,
        quantiteRestante: newQuantite,
        seuilAlerte: stock.seuilAlerte,
        restaurantId: stock.restaurantId,
        date: FieldValue.serverTimestamp(),
        read: false,
      });
      lowStockAlerts += 1;
    }
  }

  await batch.commit();
  return { success: true, lowStockAlerts };
}
