const MIN_LEAD_MINUTES = 30;
const MAX_DAYS_AHEAD = 7;

export const minScheduledDate = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() + MIN_LEAD_MINUTES);
  return d;
};

export const maxScheduledDate = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return d;
};

/** Format YYYY-MM-DDTHH:mm pour l'attribut min/max d'un input datetime-local */
export const toLocalInputValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const validateScheduledDate = (
  iso: string,
  now: Date = new Date()
): { ok: true } | { ok: false; error: string } => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { ok: false, error: 'Date invalide.' };
  if (date < minScheduledDate(now)) return { ok: false, error: `Programmez au moins ${MIN_LEAD_MINUTES} minutes à l'avance.` };
  if (date > maxScheduledDate(now)) return { ok: false, error: `Maximum ${MAX_DAYS_AHEAD} jours à l'avance.` };
  return { ok: true };
};

export const formatScheduledDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isScheduledDue = (iso: string | undefined, now: Date = new Date()): boolean => {
  if (!iso) return true; // commande immédiate
  return new Date(iso) <= now;
};
