import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { validateCoupon } from './coupon-validation';
import type { Coupon } from './types';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const baseCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  id: 'YAKRO10',
  code: 'YAKRO10',
  restaurantId: 'rest-1',
  restaurateurId: 'owner-1',
  type: 'montant_fixe',
  valeur: 1000,
  dateExpiration: Timestamp.fromDate(new Date(NOW.getTime() + DAY_MS)),
  actif: true,
  ...overrides,
});

describe('validateCoupon', () => {
  it('accepts a valid fixed-amount coupon and computes the discount', () => {
    const result = validateCoupon(baseCoupon(), 'rest-1', 5000, NOW);
    expect(result).toEqual({ valid: true, discount: 1000 });
  });

  it('accepts a valid percentage coupon and computes the discount', () => {
    const result = validateCoupon(baseCoupon({ type: 'pourcentage', valeur: 10 }), 'rest-1', 5000, NOW);
    expect(result).toEqual({ valid: true, discount: 500 });
  });

  it('caps the discount at the subtotal', () => {
    const result = validateCoupon(baseCoupon({ valeur: 99999 }), 'rest-1', 5000, NOW);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(5000);
  });

  it('rejects a coupon for a different restaurant', () => {
    const result = validateCoupon(baseCoupon(), 'other-restaurant', 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/restaurant/i);
  });

  it('rejects an inactive coupon', () => {
    const result = validateCoupon(baseCoupon({ actif: false }), 'rest-1', 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/actif/i);
  });

  it('rejects an expired coupon', () => {
    const expired = baseCoupon({ dateExpiration: Timestamp.fromDate(new Date(NOW.getTime() - DAY_MS)) });
    const result = validateCoupon(expired, 'rest-1', 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expiré/i);
  });

  it('rejects an order below the coupon minimum', () => {
    const result = validateCoupon(baseCoupon({ montantMinimum: 10000 }), 'rest-1', 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/minimum/i);
  });
});
