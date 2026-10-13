import { describe, it, expect } from 'vitest';
import { hasReliableLocation } from './geolocation';

describe('hasReliableLocation', () => {
    it('accepte une vraie position à Yamoussoukro', () => {
        expect(hasReliableLocation({ latitude: 6.8276, longitude: -5.2893 })).toBe(true);
    });

    it('refuse une position absente ou incomplète', () => {
        expect(hasReliableLocation(null)).toBe(false);
        expect(hasReliableLocation(undefined)).toBe(false);
        expect(hasReliableLocation({})).toBe(false);
        expect(hasReliableLocation({ latitude: 6.8 })).toBe(false);
        expect(hasReliableLocation({ latitude: 6.8, longitude: null })).toBe(false);
    });

    it('refuse (0, 0), produit par un champ vide converti en nombre', () => {
        expect(hasReliableLocation({ latitude: 0, longitude: 0 })).toBe(false);
    });

    it('refuse le centre-ville posé par défaut par l’ancienne création de restaurant', () => {
        expect(hasReliableLocation({ latitude: 6.82, longitude: -5.28 })).toBe(false);
    });

    it('refuse les valeurs non finies', () => {
        expect(hasReliableLocation({ latitude: Number.NaN, longitude: -5.28 })).toBe(false);
        expect(hasReliableLocation({ latitude: 6.8, longitude: Number.POSITIVE_INFINITY })).toBe(false);
    });
});
