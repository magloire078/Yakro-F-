import { describe, it, expect } from 'vitest';
import { AI_DAILY_LIMITS, aiQuotaExceededMessage, isAiAccessMessage, isWithinAiQuota, quotaDay, quotaDocId } from './ai-quota';

describe('quotaDay / quotaDocId', () => {
    it('compte par jour UTC', () => {
        expect(quotaDay(new Date('2026-10-13T23:59:59Z'))).toBe('2026-10-13');
        expect(quotaDay(new Date('2026-10-14T00:00:00Z'))).toBe('2026-10-14');
    });

    it('produit un document par utilisateur et par jour', () => {
        expect(quotaDocId('uid123', new Date('2026-10-13T10:00:00Z'))).toBe('uid123_2026-10-13');
    });
});

describe('isWithinAiQuota', () => {
    it('autorise tant que la limite n’est pas atteinte', () => {
        expect(isWithinAiQuota(undefined, 'text')).toBe(true);
        expect(isWithinAiQuota({ text: AI_DAILY_LIMITS.text - 1 }, 'text')).toBe(true);
    });

    it('refuse une fois la limite atteinte, par type d’appel', () => {
        expect(isWithinAiQuota({ text: AI_DAILY_LIMITS.text }, 'text')).toBe(false);
        expect(isWithinAiQuota({ media: AI_DAILY_LIMITS.media }, 'media')).toBe(false);
        expect(isWithinAiQuota({ text: AI_DAILY_LIMITS.text }, 'media')).toBe(true);
    });
});

describe('isAiAccessMessage', () => {
    it('reconnaît les messages de limite produits par le serveur', () => {
        expect(isAiAccessMessage(aiQuotaExceededMessage('text'))).toBe(true);
        expect(isAiAccessMessage(aiQuotaExceededMessage('media'))).toBe(true);
    });

    it('reconnaît la demande de connexion', () => {
        expect(isAiAccessMessage('Connectez-vous pour utiliser les fonctions IA de Yakro Fê.')).toBe(true);
    });

    it('laisse les pannes techniques au message générique', () => {
        expect(isAiAccessMessage('Gemini timeout')).toBe(false);
        expect(isAiAccessMessage(undefined)).toBe(false);
    });
});
