import type { DayOfWeek, HappyHour, Restaurant } from './types';

const DAYS: DayOfWeek[] = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
];

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

export const isHappyHourActive = (
  hh: HappyHour | undefined,
  now: Date = new Date()
): boolean => {
  if (!hh || !hh.actif) return false;
  if (hh.pourcentage <= 0) return false;
  const day = DAYS[now.getDay()];
  if (hh.jours && hh.jours.length > 0 && !hh.jours.includes(day)) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const debut = toMinutes(hh.debut);
  const fin = toMinutes(hh.fin);
  if (debut < 0 || fin < 0) return false;

  if (fin < debut) {
    // période traversant minuit (ex: 22:00 → 02:00)
    return current >= debut || current < fin;
  }
  return current >= debut && current < fin;
};

export const getActiveHappyHour = (
  restaurant: Pick<Restaurant, 'happyHour'> | undefined | null,
  now: Date = new Date()
): HappyHour | null => {
  if (!restaurant?.happyHour) return null;
  return isHappyHourActive(restaurant.happyHour, now) ? restaurant.happyHour : null;
};

export const applyHappyHourDiscount = (
  basePrice: number,
  happyHour: HappyHour | null
): number => {
  if (!happyHour) return basePrice;
  return Math.round(basePrice * (1 - happyHour.pourcentage / 100));
};

export const formatHappyHourLabel = (hh: HappyHour): string => {
  return `-${hh.pourcentage}% de ${hh.debut} à ${hh.fin}`;
};
