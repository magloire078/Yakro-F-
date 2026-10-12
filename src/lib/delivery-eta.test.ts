import { describe, it, expect } from 'vitest';
import { distanceMeters, estimateArrivalMinutes, formatDistance } from './delivery-eta';

describe('distanceMeters', () => {
    it('vaut 0 pour un même point', () => {
        expect(distanceMeters({ latitude: 6.82, longitude: -5.28 }, { latitude: 6.82, longitude: -5.28 })).toBe(0);
    });

    it('mesure environ 111 km pour un degré de latitude', () => {
        const d = distanceMeters({ latitude: 6, longitude: -5 }, { latitude: 7, longitude: -5 });
        expect(d).toBeGreaterThan(110_500);
        expect(d).toBeLessThan(111_500);
    });
});

describe('estimateArrivalMinutes', () => {
    it('ne descend jamais sous 1 minute', () => {
        expect(estimateArrivalMinutes(0)).toBe(1);
        expect(estimateArrivalMinutes(50)).toBe(1);
    });

    it('estime ~4 min pour 1 km à vol d’oiseau (1,35 km de route à 22 km/h)', () => {
        expect(estimateArrivalMinutes(1000)).toBe(4);
    });
});

describe('formatDistance', () => {
    it('affiche les mètres arrondis à la dizaine sous 1 km', () => {
        expect(formatDistance(847)).toBe('850 m');
        expect(formatDistance(3)).toBe('10 m');
    });

    it('affiche les kilomètres avec une décimale au-delà', () => {
        expect(formatDistance(2400)).toBe('2,4 km');
        expect(formatDistance(12_000)).toBe('12 km');
    });
});
