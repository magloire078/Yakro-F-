'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import type { Order, StockItem, UserProfile } from '@/lib/types';
import { aggregateIngredientDeductions } from '@/lib/stock-utils';
import { computeLoyaltyPoints, REFERRAL_BONUS_POINTS } from '@/lib/loyalty';

export type ProcessDeliveredOrderResult =
  | { success: true; lowStockAlerts: number; pointsAwarded: number }
  | { success: false; error: string };

/**
 * Server-side, privileged completion path triggered after a livreur marks an
 * order delivered. The Firestore rules forbid the livreur from writing to
 * `/stocks`, `/notifications` or a customer's `pointsFidelite`, so we
 * re-verify the livreur's identity via their Firebase ID token and run the
 * stock decrement, low-stock alerting and loyalty/referral crediting through
 * the Admin SDK.
 *
 * The whole thing runs inside a Firestore transaction: the read of
 * `order.livraisonTraitee` and every write it gates (stock decrement, points,
 * referral bonus) must be atomic together, or two near-simultaneous calls
 * (a livreur double-tap, a flaky retry) could both read "not yet processed"
 * before either write lands, double-crediting points via `FieldValue
 * .increment`. A plain batch — the previous approach — does not prevent
 * that: the read and the batch commit are two separate round trips. A
 * transaction re-reads and retries automatically on contention instead.
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

  try {
    return await db.runTransaction(async (tx): Promise<ProcessDeliveredOrderResult> => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) {
        return { success: false, error: 'Commande introuvable.' };
      }
      const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, 'id'>) };

      if (order.statut !== 'Livrée') {
        return { success: false, error: 'La commande n\'est pas marquée Livrée.' };
      }

      const callerRef = db.collection('utilisateurs').doc(uid);
      const callerSnap = await tx.get(callerRef);
      const isSuperAdmin = callerSnap.exists
        && (callerSnap.data() as { roleSysteme?: string }).roleSysteme === 'SuperAdmin';

      if (order.livreurId !== uid && !isSuperAdmin) {
        return { success: false, error: 'Accès refusé.' };
      }

      if (order.livraisonTraitee) {
        return { success: true, lowStockAlerts: 0, pointsAwarded: 0 };
      }

      const deductions = aggregateIngredientDeductions(order.plats);
      const stockItemIds = Object.keys(deductions);
      const stockRefs = stockItemIds.map((id) => db.collection('stocks').doc(id));
      const stockSnaps = stockRefs.length > 0 ? await tx.getAll(...stockRefs) : [];

      const customerRef = db.collection('utilisateurs').doc(order.userId);
      const customerSnap = await tx.get(customerRef);
      const customer = customerSnap.exists ? (customerSnap.data() as UserProfile) : null;

      // Toutes les lectures sont faites : place aux écritures.
      const now = new Date().toISOString();
      let lowStockAlerts = 0;

      for (const snap of stockSnaps) {
        if (!snap.exists) continue;
        const stock = snap.data() as StockItem;
        const delta = deductions[snap.id].quantite;
        const newQuantite = stock.quantite - delta;

        tx.update(snap.ref, {
          quantite: FieldValue.increment(-delta),
          derniereMiseAJour: now,
        });

        const wasAboveThreshold = stock.quantite > stock.seuilAlerte;
        const isAtOrBelowThreshold = newQuantite <= stock.seuilAlerte;
        if (wasAboveThreshold && isAtOrBelowThreshold && stock.restaurateurId) {
          const notifRef = db.collection('notifications').doc();
          tx.set(notifRef, {
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

      // Fidélité : le client gagne des points sur le montant total de la
      // commande, crédités uniquement ici (jamais côté client).
      const pointsAwarded = computeLoyaltyPoints(order.total);
      if (pointsAwarded > 0) {
        tx.update(customerRef, { pointsFidelite: FieldValue.increment(pointsAwarded) });
      }

      // Parrainage : à la première commande livrée d'un filleul, son parrain
      // reçoit un bonus. `filleulRecompenseVersee` empêche tout second crédit.
      if (customer?.parrainId && !customer.filleulRecompenseVersee) {
        const parrainRef = db.collection('utilisateurs').doc(customer.parrainId);
        tx.update(parrainRef, { pointsFidelite: FieldValue.increment(REFERRAL_BONUS_POINTS) });
        tx.update(customerRef, { filleulRecompenseVersee: true });
      }

      tx.update(orderRef, { livraisonTraitee: true });

      return { success: true, lowStockAlerts, pointsAwarded };
    });
  } catch (err) {
    console.error('processDeliveredOrderAction: échec de la transaction', err);
    return { success: false, error: 'Erreur lors du traitement de la livraison.' };
  }
}
