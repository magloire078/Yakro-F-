import type { AppNotification, Order } from './types';
import { Timestamp } from 'firebase/firestore';

/**
 * Default delays (in minutes) after which orders surface as overdue alerts.
 * `Placée` orders are flagged once acceptance is late, `En Préparation`
 * orders once cooking goes long.
 */
export const DEFAULT_OVERDUE_THRESHOLDS: Record<Order['statut'], number | undefined> = {
  'Placée': 5,
  'En Préparation': 25,
  'Prête': undefined,
  'En Route': undefined,
  'Livrée': undefined,
  'Annulée': undefined,
};

/** Backwards-compat alias used by older imports. */
export const ORDER_OVERDUE_THRESHOLD_MIN = DEFAULT_OVERDUE_THRESHOLDS['Placée']!;

interface DerivedAlertOptions {
  /** Override for tests; defaults to current time. */
  now?: Date;
  /**
   * Per-status threshold overrides. Statuses left undefined fall back to
   * `DEFAULT_OVERDUE_THRESHOLDS`. Setting a status to `undefined` disables
   * its alert.
   */
  thresholds?: Partial<Record<Order['statut'], number | undefined>>;
  /**
   * `'mine'` (default) keeps only orders whose `restaurateurId` matches
   * `recipientUid`. `'all'` returns alerts for every order — used by the
   * SuperAdmin admin-alerts panel.
   */
  scope?: 'mine' | 'all';
}

/**
 * Computes derived overdue-order alerts from the orders already loaded
 * client-side. These are transient (not persisted in /notifications) — they
 * disappear automatically as soon as the order leaves the offending status,
 * so there is nothing to mark as read.
 */
export function getOverdueOrderAlerts(
  orders: Order[],
  recipientUid: string,
  options: DerivedAlertOptions = {},
): AppNotification[] {
  const { now = new Date(), thresholds = {}, scope = 'mine' } = options;
  const result: AppNotification[] = [];

  for (const o of orders) {
    if (scope === 'mine' && o.restaurateurId !== recipientUid) continue;

    // Distinguish "not overridden" from "explicitly disabled (set to undefined)".
    const minutesThreshold = o.statut in thresholds
      ? thresholds[o.statut]
      : DEFAULT_OVERDUE_THRESHOLDS[o.statut];
    if (minutesThreshold === undefined) continue;

    const placedAt = new Date(o.date);
    const ageMs = now.getTime() - placedAt.getTime();
    if (ageMs < minutesThreshold * 60 * 1000) continue;

    result.push({
      id: `overdue-${o.id}`,
      userId: recipientUid,
      type: 'ORDER_OVERDUE',
      read: false,
      date: Timestamp.fromDate(placedAt),
      orderId: o.id,
      total: o.total,
      ageMinutes: Math.floor(ageMs / 60_000),
      restaurantId: o.restaurantId,
    });
  }
  return result;
}
