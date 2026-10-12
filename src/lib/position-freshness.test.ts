import { describe, it, expect } from 'vitest';
import { formatPositionAge, positionFreshness } from './position-freshness';

const NOW = 1_800_000_000_000;
const at = (msAgo: number) => ({ toMillis: () => NOW - msAgo });

describe('positionFreshness', () => {
    it('considère en direct une position de moins de 2 minutes', () => {
        expect(positionFreshness(at(0), NOW)).toBe('live');
        expect(positionFreshness(at(119_000), NOW)).toBe('live');
    });

    it('signale un signal perdu entre 2 et 30 minutes', () => {
        expect(positionFreshness(at(3 * 60_000), NOW)).toBe('stale');
        expect(positionFreshness(at(29 * 60_000), NOW)).toBe('stale');
    });

    it('expire au-delà de 30 minutes ou sans horodatage', () => {
        expect(positionFreshness(at(31 * 60_000), NOW)).toBe('expired');
        expect(positionFreshness(undefined, NOW)).toBe('expired');
        expect(positionFreshness(null, NOW)).toBe('expired');
    });
});

describe('formatPositionAge', () => {
    it('affiche des minutes puis des heures', () => {
        expect(formatPositionAge(at(10_000), NOW)).toBe('il y a 1 min');
        expect(formatPositionAge(at(4 * 60_000), NOW)).toBe('il y a 4 min');
        expect(formatPositionAge(at(90 * 60_000), NOW)).toBe('il y a 2 h');
    });
});
