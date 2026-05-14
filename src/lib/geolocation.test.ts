import { describe, it, expect } from 'vitest';
import { shouldEmitLocation, type WatchLocationOptions } from './geolocation';

const opts: Required<WatchLocationOptions> = {
  minDistanceMeters: 50,
  minIntervalMs: 30_000,
};

describe('shouldEmitLocation', () => {
  it('always emits the very first sample', () => {
    expect(shouldEmitLocation({ latitude: 6.82, longitude: -5.28 }, 0, null, null, opts)).toBe(true);
  });

  it('skips a sample very close in space and time', () => {
    const last = { latitude: 6.82000, longitude: -5.28000 };
    const next = { latitude: 6.82001, longitude: -5.28001 }; // ~1 m
    expect(shouldEmitLocation(next, 5_000, last, 0, opts)).toBe(false);
  });

  it('emits when enough time has elapsed even without movement', () => {
    const last = { latitude: 6.82, longitude: -5.28 };
    const next = { latitude: 6.82, longitude: -5.28 };
    expect(shouldEmitLocation(next, 30_000, last, 0, opts)).toBe(true);
  });

  it('emits when distance exceeds threshold even without time elapsed', () => {
    const last = { latitude: 6.82, longitude: -5.28 };
    // ~150 m east
    const next = { latitude: 6.82, longitude: -5.27865 };
    expect(shouldEmitLocation(next, 1_000, last, 0, opts)).toBe(true);
  });

  it('respects custom thresholds', () => {
    const last = { latitude: 6.82, longitude: -5.28 };
    const next = { latitude: 6.82001, longitude: -5.28 }; // ~1 m
    const tighter: Required<WatchLocationOptions> = { minDistanceMeters: 0.5, minIntervalMs: 60_000 };
    expect(shouldEmitLocation(next, 1_000, last, 0, tighter)).toBe(true);
  });
});
