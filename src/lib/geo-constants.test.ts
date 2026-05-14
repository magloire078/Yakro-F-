import { describe, it, expect } from 'vitest';
import {
  YAKRO_DEFAULT_LOCATION,
  CI_BOUNDS,
  isWithinCoteIvoire,
  haversineDistanceKm,
} from './geo-constants';

describe('YAKRO_DEFAULT_LOCATION', () => {
  it('points within Côte d\'Ivoire bounds', () => {
    expect(isWithinCoteIvoire(YAKRO_DEFAULT_LOCATION.latitude, YAKRO_DEFAULT_LOCATION.longitude)).toBe(true);
  });
});

describe('isWithinCoteIvoire', () => {
  it('accepts a Yamoussoukro coordinate', () => {
    expect(isWithinCoteIvoire(6.82, -5.28)).toBe(true);
  });

  it('accepts an Abidjan coordinate', () => {
    expect(isWithinCoteIvoire(5.36, -4.0)).toBe(true);
  });

  it('rejects a Paris coordinate (forged livreur position)', () => {
    expect(isWithinCoteIvoire(48.85, 2.35)).toBe(false);
  });

  it('rejects a New York coordinate', () => {
    expect(isWithinCoteIvoire(40.71, -74.0)).toBe(false);
  });

  it('rejects NaN / Infinity', () => {
    expect(isWithinCoteIvoire(NaN, -5)).toBe(false);
    expect(isWithinCoteIvoire(7, Infinity)).toBe(false);
  });

  it('respects the declared bounds at the edges', () => {
    expect(isWithinCoteIvoire(CI_BOUNDS.minLatitude, CI_BOUNDS.minLongitude)).toBe(true);
    expect(isWithinCoteIvoire(CI_BOUNDS.maxLatitude, CI_BOUNDS.maxLongitude)).toBe(true);
    expect(isWithinCoteIvoire(CI_BOUNDS.minLatitude - 0.01, 0)).toBe(false);
  });
});

describe('haversineDistanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceKm({ latitude: 6.82, longitude: -5.28 }, { latitude: 6.82, longitude: -5.28 })).toBeCloseTo(0);
  });

  it('matches the known Yamoussoukro → Abidjan distance (~210 km)', () => {
    const yamoussoukro = { latitude: 6.82, longitude: -5.28 };
    const abidjan = { latitude: 5.36, longitude: -4.0 };
    const distance = haversineDistanceKm(yamoussoukro, abidjan);
    // Real road distance is ~234 km, straight-line is ~215 km.
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(230);
  });

  it('is symmetric', () => {
    const a = { latitude: 6.82, longitude: -5.28 };
    const b = { latitude: 5.36, longitude: -4.0 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 4);
  });
});
