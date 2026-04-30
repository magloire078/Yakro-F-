import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEEKLY_HOURS,
  ORDERED_DAYS,
  isRestaurantOpen,
  getNextOpeningLabel,
} from './restaurant-hours';
import type { WeeklyHours } from './types';

const at = (h: number, m: number, dayOfWeek: number) => {
  const d = new Date(2026, 3, 26, h, m); // 26 avril 2026 = dimanche
  const offset = (dayOfWeek - 0 + 7) % 7;
  d.setDate(26 + offset);
  return d;
};

const closedAll: WeeklyHours = ORDERED_DAYS.reduce((acc, day) => {
  acc[day] = { ferme: true, ouverture: '00:00', fermeture: '00:00' };
  return acc;
}, {} as WeeklyHours);

describe('isRestaurantOpen', () => {
  it('fermeture temporaire prévaut sur tout', () => {
    expect(isRestaurantOpen({ horaires: DEFAULT_WEEKLY_HOURS, fermetureTemporaire: true }, at(12, 0, 1))).toBe(false);
  });

  it('absence d\'horaires = considéré ouvert', () => {
    expect(isRestaurantOpen({}, at(12, 0, 1))).toBe(true);
  });

  it('respecte les horaires par défaut (08:00-22:00)', () => {
    expect(isRestaurantOpen({ horaires: DEFAULT_WEEKLY_HOURS }, at(12, 0, 1))).toBe(true);
    expect(isRestaurantOpen({ horaires: DEFAULT_WEEKLY_HOURS }, at(7, 59, 1))).toBe(false);
    expect(isRestaurantOpen({ horaires: DEFAULT_WEEKLY_HOURS }, at(22, 0, 1))).toBe(false);
  });

  it('respecte le statut "ferme" du jour', () => {
    expect(isRestaurantOpen({ horaires: closedAll }, at(12, 0, 1))).toBe(false);
  });

  it('gère les horaires nocturnes (18h - 02h)', () => {
    const hours: WeeklyHours = {
      ...DEFAULT_WEEKLY_HOURS,
      lundi: { ferme: false, ouverture: '18:00', fermeture: '02:00' },
      mardi: { ferme: false, ouverture: '18:00', fermeture: '02:00' },
    };
    // Lundi 23h
    expect(isRestaurantOpen({ horaires: hours }, at(23, 0, 1))).toBe(true);
    // Mardi 01h (fait suite à lundi)
    expect(isRestaurantOpen({ horaires: hours }, at(1, 0, 2))).toBe(true);
    // Lundi 17h (avant)
    expect(isRestaurantOpen({ horaires: hours }, at(17, 0, 1))).toBe(false);
  });
});

describe('getNextOpeningLabel', () => {
  it('annonce une fermeture temporaire', () => {
    expect(getNextOpeningLabel({ fermetureTemporaire: true })).toBe('Fermeture temporaire');
  });

  it('null si aucun horaire défini', () => {
    expect(getNextOpeningLabel({})).toBeNull();
  });

  it('annonce l\'ouverture du jour si pas encore ouvert', () => {
    const label = getNextOpeningLabel({ horaires: DEFAULT_WEEKLY_HOURS }, at(6, 0, 1));
    expect(label).toBe('Ouvre à 08:00');
  });

  it('annonce le prochain jour si fermé aujourd\'hui', () => {
    const horaires: WeeklyHours = {
      ...DEFAULT_WEEKLY_HOURS,
      lundi: { ferme: true, ouverture: '08:00', fermeture: '22:00' },
    };
    const label = getNextOpeningLabel({ horaires }, at(12, 0, 1));
    expect(label).toContain('Mardi');
  });
});
