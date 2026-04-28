import type { DayOfWeek, Restaurant, WeeklyHours } from './types';

const DAYS: DayOfWeek[] = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

export const ORDERED_DAYS: DayOfWeek[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = ORDERED_DAYS.reduce((acc, day) => {
  acc[day] = { ferme: false, ouverture: '08:00', fermeture: '22:00' };
  return acc;
}, {} as WeeklyHours);

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

export const isRestaurantOpen = (restaurant: Pick<Restaurant, 'horaires' | 'fermetureTemporaire'>, now: Date = new Date()): boolean => {
  if (restaurant.fermetureTemporaire) return false;
  if (!restaurant.horaires) return true; // par défaut considéré ouvert si non configuré

  const day = DAYS[now.getDay()];
  const dayHours = restaurant.horaires[day];
  if (!dayHours || dayHours.ferme) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(dayHours.ouverture);
  const close = toMinutes(dayHours.fermeture);
  if (open < 0 || close < 0) return true;

  // Gère le cas d'horaires de nuit (ex: 18:00 - 02:00)
  if (close < open) {
    return current >= open || current < close;
  }
  return current >= open && current < close;
};

export const getNextOpeningLabel = (restaurant: Pick<Restaurant, 'horaires' | 'fermetureTemporaire'>, now: Date = new Date()): string | null => {
  if (restaurant.fermetureTemporaire) return 'Fermeture temporaire';
  if (!restaurant.horaires) return null;
  const todayDay = DAYS[now.getDay()];
  const today = restaurant.horaires[todayDay];
  if (today && !today.ferme) {
    const current = now.getHours() * 60 + now.getMinutes();
    const open = toMinutes(today.ouverture);
    if (open > current) return `Ouvre à ${today.ouverture}`;
  }
  for (let i = 1; i <= 7; i++) {
    const next = DAYS[(now.getDay() + i) % 7];
    const h = restaurant.horaires[next];
    if (h && !h.ferme) {
      return `Ouvre ${DAY_LABELS[next]} à ${h.ouverture}`;
    }
  }
  return null;
};
