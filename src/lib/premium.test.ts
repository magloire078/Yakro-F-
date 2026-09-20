import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { isPremiumActive, computeNewPremiumExpiry, PREMIUM_DURATION_DAYS } from './premium';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('isPremiumActive', () => {
  it('is false when premiumJusquau is unset', () => {
    expect(isPremiumActive(undefined, NOW)).toBe(false);
  });

  it('is true when the expiry is in the future', () => {
    const expiry = Timestamp.fromDate(new Date(NOW.getTime() + DAY_MS));
    expect(isPremiumActive(expiry, NOW)).toBe(true);
  });

  it('is false when the expiry is in the past', () => {
    const expiry = Timestamp.fromDate(new Date(NOW.getTime() - DAY_MS));
    expect(isPremiumActive(expiry, NOW)).toBe(false);
  });
});

describe('computeNewPremiumExpiry', () => {
  it('starts a fresh period from now when there is no current subscription', () => {
    const result = computeNewPremiumExpiry(undefined, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + PREMIUM_DURATION_DAYS * DAY_MS);
  });

  it('starts a fresh period from now when the previous one already expired', () => {
    const expired = Timestamp.fromDate(new Date(NOW.getTime() - DAY_MS));
    const result = computeNewPremiumExpiry(expired, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + PREMIUM_DURATION_DAYS * DAY_MS);
  });

  it('stacks the new period onto the remaining time of an active subscription', () => {
    const stillActive = Timestamp.fromDate(new Date(NOW.getTime() + 5 * DAY_MS));
    const result = computeNewPremiumExpiry(stillActive, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + (5 + PREMIUM_DURATION_DAYS) * DAY_MS);
  });
});
