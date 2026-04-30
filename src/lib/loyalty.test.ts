import { describe, expect, it } from 'vitest';
import {
  computeLoyaltyDeliveryDiscount,
  computeOrderPoints,
  computePointsFromOrders,
  getTierForPoints,
  TIERS,
} from './loyalty';
import type { Order } from './types';

const buildOrder = (over: Partial<Order>): Order => ({
  id: over.id ?? 'o1',
  userId: over.userId ?? 'u1',
  plats: [],
  sousTotal: over.sousTotal ?? 0,
  fraisDeLivraison: 0,
  total: 0,
  tauxCommission: 0.15,
  montantCommission: 0,
  revenuNet: 0,
  date: '2026-04-30T12:00:00Z',
  nomRestaurant: 'Test',
  restaurantId: 'r1',
  statut: over.statut ?? 'Livrée',
  adresseClient: '',
  adresseRestaurant: '',
  telephoneClient: '',
  ...over,
});

describe('computeOrderPoints', () => {
  it('1 point par tranche complète de 100 FCFA', () => {
    expect(computeOrderPoints(0)).toBe(0);
    expect(computeOrderPoints(99)).toBe(0);
    expect(computeOrderPoints(100)).toBe(1);
    expect(computeOrderPoints(199)).toBe(1);
    expect(computeOrderPoints(2500)).toBe(25);
    expect(computeOrderPoints(10050)).toBe(100);
  });
});

describe('computePointsFromOrders', () => {
  it('ne compte que les commandes livrées de cet utilisateur', () => {
    const orders: Order[] = [
      buildOrder({ id: 'a', sousTotal: 5000, statut: 'Livrée', userId: 'me' }),
      buildOrder({ id: 'b', sousTotal: 3000, statut: 'Placée', userId: 'me' }),
      buildOrder({ id: 'c', sousTotal: 8000, statut: 'Livrée', userId: 'autre' }),
      buildOrder({ id: 'd', sousTotal: 1500, statut: 'Livrée', userId: 'me' }),
    ];
    expect(computePointsFromOrders(orders, 'me')).toBe(50 + 15);
  });

  it('utilise pointsGagnes si présent (audit)', () => {
    const orders: Order[] = [
      buildOrder({ id: 'a', sousTotal: 5000, statut: 'Livrée', userId: 'me', pointsGagnes: 100 }),
    ];
    expect(computePointsFromOrders(orders, 'me')).toBe(100);
  });
});

describe('getTierForPoints', () => {
  it('Bronze sous 100', () => {
    expect(getTierForPoints(0).tier).toBe('Bronze');
    expect(getTierForPoints(99).tier).toBe('Bronze');
  });

  it('Argent à partir de 100', () => {
    expect(getTierForPoints(100).tier).toBe('Argent');
    expect(getTierForPoints(499).tier).toBe('Argent');
  });

  it('Or à partir de 500', () => {
    expect(getTierForPoints(500).tier).toBe('Or');
    expect(getTierForPoints(99999).tier).toBe('Or');
  });

  it('expose les seuils corrects', () => {
    expect(TIERS.Bronze.nextThreshold).toBe(100);
    expect(TIERS.Argent.nextThreshold).toBe(500);
    expect(TIERS.Or.nextThreshold).toBeUndefined();
  });
});

describe('computeLoyaltyDeliveryDiscount', () => {
  it('Bronze : aucune réduction', () => {
    expect(computeLoyaltyDeliveryDiscount('Bronze', 1500)).toBe(0);
  });

  it('Argent : -100 FCFA plafonnés au montant des frais', () => {
    expect(computeLoyaltyDeliveryDiscount('Argent', 1500)).toBe(100);
    expect(computeLoyaltyDeliveryDiscount('Argent', 50)).toBe(50);
  });

  it('Or : 100% offerts', () => {
    expect(computeLoyaltyDeliveryDiscount('Or', 1500)).toBe(1500);
    expect(computeLoyaltyDeliveryDiscount('Or', 0)).toBe(0);
  });
});
