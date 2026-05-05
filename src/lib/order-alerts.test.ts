import { describe, it, expect } from 'vitest';
import type { Order } from './types';
import { getOverdueOrderAlerts, ORDER_OVERDUE_THRESHOLD_MIN } from './order-alerts';

const buildOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    statut: 'Placée',
    restaurateurId: 'resto-1',
    restaurantId: 'rest-1',
    date: '2026-05-04T12:00:00.000Z',
    total: 5000,
    plats: [],
    userId: 'u1',
    sousTotal: 5000,
    fraisDeLivraison: 0,
    tauxCommission: 0.15,
    montantCommission: 750,
    revenuNet: 4250,
    nomRestaurant: 'X',
    adresseClient: 'X',
    adresseRestaurant: 'X',
    telephoneClient: 'X',
    ...overrides,
  }) as Order;

describe('getOverdueOrderAlerts', () => {
  const recipient = 'resto-1';
  const placedAt = '2026-05-04T12:00:00.000Z';

  it('returns no alert before the threshold elapses', () => {
    const now = new Date('2026-05-04T12:04:00.000Z'); // 4 min, threshold is 5
    expect(getOverdueOrderAlerts([buildOrder({ date: placedAt })], recipient, { now })).toEqual([]);
  });

  it('returns an alert once the order has been Placée past the threshold', () => {
    const now = new Date('2026-05-04T12:09:00.000Z'); // 9 min
    const alerts = getOverdueOrderAlerts([buildOrder({ date: placedAt })], recipient, { now });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('ORDER_OVERDUE');
    expect(alerts[0].orderId).toBe('o1');
    expect(alerts[0].ageMinutes).toBe(9);
    expect(alerts[0].id).toBe('overdue-o1');
  });

  it('ignores orders not in Placée status', () => {
    const now = new Date('2026-05-04T13:00:00.000Z');
    const alerts = getOverdueOrderAlerts(
      [buildOrder({ date: placedAt, statut: 'En Préparation' })],
      recipient,
      { now },
    );
    expect(alerts).toEqual([]);
  });

  it('ignores orders for other restaurateurs', () => {
    const now = new Date('2026-05-04T13:00:00.000Z');
    const alerts = getOverdueOrderAlerts(
      [buildOrder({ date: placedAt, restaurateurId: 'someone-else' })],
      recipient,
      { now },
    );
    expect(alerts).toEqual([]);
  });

  it('respects a custom threshold', () => {
    const now = new Date('2026-05-04T12:01:30.000Z'); // 1.5 min
    const alerts = getOverdueOrderAlerts(
      [buildOrder({ date: placedAt })],
      recipient,
      { now, thresholdMinutes: 1 },
    );
    expect(alerts).toHaveLength(1);
  });

  it('exports a sane default threshold', () => {
    expect(ORDER_OVERDUE_THRESHOLD_MIN).toBeGreaterThan(0);
  });
});
