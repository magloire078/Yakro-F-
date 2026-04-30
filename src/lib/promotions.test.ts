import { describe, expect, it } from 'vitest';
import {
  applyHappyHourDiscount,
  formatHappyHourLabel,
  getActiveHappyHour,
  isHappyHourActive,
} from './promotions';
import type { HappyHour } from './types';

const buildHH = (over: Partial<HappyHour> = {}): HappyHour => ({
  pourcentage: 20,
  debut: '17:00',
  fin: '19:00',
  actif: true,
  ...over,
});

const at = (h: number, m: number = 0, day: number = 1) => {
  // day : 0 dimanche → 6 samedi
  const d = new Date(2026, 3, 27, h, m); // 27 avril 2026 = lundi
  // Force le jour de la semaine en partant d'un lundi (27/04/2026).
  const offset = (day - 1 + 7) % 7;
  d.setDate(27 + offset);
  return d;
};

describe('isHappyHourActive', () => {
  it('inactive si actif=false', () => {
    expect(isHappyHourActive(buildHH({ actif: false }), at(18))).toBe(false);
  });

  it('active dans la plage horaire', () => {
    expect(isHappyHourActive(buildHH(), at(17))).toBe(true);
    expect(isHappyHourActive(buildHH(), at(18, 30))).toBe(true);
  });

  it('inactive avant la plage', () => {
    expect(isHappyHourActive(buildHH(), at(16, 59))).toBe(false);
  });

  it('inactive à la fin (exclusive)', () => {
    expect(isHappyHourActive(buildHH(), at(19))).toBe(false);
    expect(isHappyHourActive(buildHH(), at(19, 1))).toBe(false);
  });

  it('gère les périodes traversant minuit (22h → 02h)', () => {
    const hh = buildHH({ debut: '22:00', fin: '02:00' });
    expect(isHappyHourActive(hh, at(23))).toBe(true);
    expect(isHappyHourActive(hh, at(1))).toBe(true);
    expect(isHappyHourActive(hh, at(2))).toBe(false);
    expect(isHappyHourActive(hh, at(15))).toBe(false);
  });

  it('respecte la liste de jours actifs', () => {
    const hh = buildHH({ jours: ['vendredi'] });
    expect(isHappyHourActive(hh, at(18, 0, 5))).toBe(true);  // vendredi
    expect(isHappyHourActive(hh, at(18, 0, 1))).toBe(false); // lundi
  });

  it('jours absents = tous les jours', () => {
    expect(isHappyHourActive(buildHH(), at(18, 0, 0))).toBe(true);
    expect(isHappyHourActive(buildHH(), at(18, 0, 6))).toBe(true);
  });

  it('rejette pourcentage 0 ou négatif', () => {
    expect(isHappyHourActive(buildHH({ pourcentage: 0 }), at(18))).toBe(false);
    expect(isHappyHourActive(buildHH({ pourcentage: -5 }), at(18))).toBe(false);
  });

  it('rejette horaires malformés', () => {
    expect(isHappyHourActive(buildHH({ debut: 'XX' }), at(18))).toBe(false);
  });
});

describe('getActiveHappyHour', () => {
  it('renvoie null si pas de HH', () => {
    expect(getActiveHappyHour({ happyHour: undefined }, at(18))).toBeNull();
    expect(getActiveHappyHour(null, at(18))).toBeNull();
  });

  it('renvoie la HH si elle est active', () => {
    const hh = buildHH();
    expect(getActiveHappyHour({ happyHour: hh }, at(18))).toEqual(hh);
  });

  it('renvoie null si la HH est définie mais hors créneau', () => {
    expect(getActiveHappyHour({ happyHour: buildHH() }, at(10))).toBeNull();
  });
});

describe('applyHappyHourDiscount', () => {
  it('renvoie le prix original sans HH', () => {
    expect(applyHappyHourDiscount(2500, null)).toBe(2500);
  });

  it('applique le pourcentage et arrondit', () => {
    expect(applyHappyHourDiscount(2500, buildHH({ pourcentage: 20 }))).toBe(2000);
    expect(applyHappyHourDiscount(3333, buildHH({ pourcentage: 15 }))).toBe(2833);
  });
});

describe('formatHappyHourLabel', () => {
  it('formatte la plage et le pourcentage', () => {
    expect(formatHappyHourLabel(buildHH({ pourcentage: 25, debut: '17:00', fin: '19:30' })))
      .toBe('-25% de 17:00 à 19:30');
  });
});
