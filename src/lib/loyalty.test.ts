import { describe, it, expect } from 'vitest';
import { computeLoyaltyPoints, LOYALTY_POINTS_PER_1000_FCFA, REFERRAL_BONUS_POINTS } from './loyalty';

describe('computeLoyaltyPoints', () => {
  it('awards 10 points per 1000 FCFA', () => {
    expect(computeLoyaltyPoints(1000)).toBe(LOYALTY_POINTS_PER_1000_FCFA);
    expect(computeLoyaltyPoints(5000)).toBe(50);
  });

  it('rounds down to the nearest thousand', () => {
    expect(computeLoyaltyPoints(4999)).toBe(40);
    expect(computeLoyaltyPoints(1999)).toBe(10);
  });

  it('awards zero points below 1000 FCFA', () => {
    expect(computeLoyaltyPoints(500)).toBe(0);
    expect(computeLoyaltyPoints(0)).toBe(0);
  });

  it('exposes the referral bonus as a constant', () => {
    expect(REFERRAL_BONUS_POINTS).toBe(50);
  });
});
