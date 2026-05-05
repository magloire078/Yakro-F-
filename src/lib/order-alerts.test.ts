import { describe, it, expect } from 'vitest';
import type { Order } from './types';
import {
  getOverdueOrderAlerts,
  ORDER_OVERDUE_THRESHOLD_MIN,
  DEFAULT_OVERDUE_THRESHOLDS,
} from './order-alerts';

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

  it('flags long-running En Préparation orders past their own threshold', () => {
    const now = new Date('2026-05-04T12:30:00.000Z'); // 30 min, threshold is 25
    const alerts = getOverdueOrderAlerts(
      [buildOrder({ date: placedAt, statut: 'En Préparation' })],
      recipient,
      { now },
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].ageMinutes).toBe(30);
  });

  it('does not flag En Préparation orders before 25 minutes', () => {
    const now = new Date('2026-05-04T12:20:00.000Z'); // 20 min
    expect(
      getOverdueOrderAlerts(
        [buildOrder({ date: placedAt, statut: 'En Préparation' })],
        recipient,
        { now },
      ),
    ).toEqual([]);
  });

  it('ignores statuses without a threshold (En Route, Livrée, …)', () => {
    const now = new Date('2026-05-04T20:00:00.000Z'); // 8h later
    expect(
      getOverdueOrderAlerts(
        [buildOrder({ date: placedAt, statut: 'En Route', livreurId: 'l1' })],
        recipient,
        { now },
      ),
    ).toEqual([]);
  });

  it('ignores orders for other restaurateurs in scope=mine (default)', () => {
    const now = new Date('2026-05-04T13:00:00.000Z');
    expect(
      getOverdueOrderAlerts(
        [buildOrder({ date: placedAt, restaurateurId: 'someone-else' })],
        recipient,
        { now },
      ),
    ).toEqual([]);
  });

  it('returns alerts across all restaurateurs when scope=all (SuperAdmin)', () => {
    const now = new Date('2026-05-04T13:00:00.000Z');
    const alerts = getOverdueOrderAlerts(
      [
        buildOrder({ id: 'o1', date: placedAt, restaurateurId: 'resto-1' }),
        buildOrder({ id: 'o2', date: placedAt, restaurateurId: 'resto-2' }),
      ],
      'admin',
      { now, scope: 'all' },
    );
    expect(alerts.map(a => a.orderId).sort()).toEqual(['o1', 'o2']);
  });

  it('respects a custom threshold override', () => {
    const now = new Date('2026-05-04T12:01:30.000Z'); // 1.5 min
    const alerts = getOverdueOrderAlerts(
      [buildOrder({ date: placedAt })],
      recipient,
      { now, thresholds: { 'Placée': 1 } },
    );
    expect(alerts).toHaveLength(1);
  });

  it('lets a caller disable a threshold by setting it to undefined', () => {
    const now = new Date('2026-05-04T20:00:00.000Z');
    expect(
      getOverdueOrderAlerts(
        [buildOrder({ date: placedAt })],
        recipient,
        { now, thresholds: { 'Placée': undefined } },
      ),
    ).toEqual([]);
  });

  it('exports backwards-compatible threshold constants', () => {
    expect(ORDER_OVERDUE_THRESHOLD_MIN).toBe(DEFAULT_OVERDUE_THRESHOLDS['Placée']);
    expect(DEFAULT_OVERDUE_THRESHOLDS['Placée']).toBeGreaterThan(0);
    expect(DEFAULT_OVERDUE_THRESHOLDS['En Préparation']).toBeGreaterThan(0);
  });
});
