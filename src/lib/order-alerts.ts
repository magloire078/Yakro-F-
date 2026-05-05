import type { AppNotification, Order } from './types';
import { Timestamp } from 'firebase/firestore';

/**
 * Default delay (in minutes) after which a `Placée` order is considered
 * overdue and should surface as an alert in the restaurateur bell.
 */
export const ORDER_OVERDUE_THRESHOLD_MIN = 5;

interface DerivedAlertOptions {
  /** Override for tests; defaults to current time. */
  now?: Date;
  thresholdMinutes?: number;
}

/**
 * Computes derived `ORDER_OVERDUE` alerts from the orders already loaded
 * client-side. These are transient (not persisted in /notifications) — they
 * disappear automatically as soon as the order is accepted by the
 * restaurateur, so there is nothing to mark as read.
 */
export function getOverdueOrderAlerts(
  orders: Order[],
  recipientUid: string,
  options: DerivedAlertOptions = {},
): AppNotification[] {
  const { now = new Date(), thresholdMinutes = ORDER_OVERDUE_THRESHOLD_MIN } = options;
  const cutoffMs = thresholdMinutes * 60 * 1000;

  const result: AppNotification[] = [];
  for (const o of orders) {
    if (o.statut !== 'Placée' || o.restaurateurId !== recipientUid) continue;
    const placedAt = new Date(o.date);
    const ageMs = now.getTime() - placedAt.getTime();
    if (ageMs < cutoffMs) continue;
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
