import { describe, expect, it } from 'vitest';
import {
  formatScheduledDate,
  isScheduledDue,
  maxScheduledDate,
  minScheduledDate,
  toLocalInputValue,
  validateScheduledDate,
} from './scheduled-orders';

const NOW = new Date('2026-04-30T12:00:00');

describe('minScheduledDate', () => {
  it('renvoie now + 30 minutes', () => {
    const min = minScheduledDate(NOW);
    expect(min.getTime() - NOW.getTime()).toBe(30 * 60 * 1000);
  });
});

describe('maxScheduledDate', () => {
  it('renvoie now + 7 jours', () => {
    const max = maxScheduledDate(NOW);
    expect(max.getTime() - NOW.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('toLocalInputValue', () => {
  it('formatte au format YYYY-MM-DDTHH:mm', () => {
    expect(toLocalInputValue(new Date(2026, 3, 30, 14, 5))).toBe('2026-04-30T14:05');
    expect(toLocalInputValue(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01T00:00');
  });
});

describe('validateScheduledDate', () => {
  it('rejette une date trop proche', () => {
    const isoTooClose = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString();
    const result = validateScheduledDate(isoTooClose, NOW);
    expect(result.ok).toBe(false);
  });

  it('accepte une date suffisamment dans le futur', () => {
    const isoOk = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
    const result = validateScheduledDate(isoOk, NOW);
    expect(result.ok).toBe(true);
  });

  it('rejette une date au-delà de 7 jours', () => {
    const isoFar = new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();
    const result = validateScheduledDate(isoFar, NOW);
    expect(result.ok).toBe(false);
  });

  it('rejette une date invalide', () => {
    const result = validateScheduledDate('PAS_UNE_DATE', NOW);
    expect(result.ok).toBe(false);
  });
});

describe('isScheduledDue', () => {
  it('renvoie true si non programmée', () => {
    expect(isScheduledDue(undefined, NOW)).toBe(true);
  });

  it('renvoie true si l\'heure est passée', () => {
    expect(isScheduledDue('2026-04-30T11:00:00', NOW)).toBe(true);
  });

  it('renvoie false si l\'heure est dans le futur', () => {
    expect(isScheduledDue('2026-05-01T12:00:00', NOW)).toBe(false);
  });
});

describe('formatScheduledDate', () => {
  it('formatte en français', () => {
    const formatted = formatScheduledDate('2026-04-30T14:00:00');
    // Le format inclut le jour de semaine, jour, mois, heure
    expect(formatted).toMatch(/jeudi/i);
    expect(formatted).toMatch(/avril/i);
  });
});
