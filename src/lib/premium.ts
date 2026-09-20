import { Timestamp } from 'firebase/firestore';

/** Prix de l'abonnement Premium, en FCFA, pour une période de 30 jours. */
export const PREMIUM_PRICE_FCFA = 2000;
export const PREMIUM_DURATION_DAYS = 30;

/**
 * Un compte est Premium tant que `premiumJusquau` est dans le futur.
 * Absence de champ = jamais Premium.
 */
export function isPremiumActive(premiumJusquau: Timestamp | undefined, now: Date = new Date()): boolean {
  if (!premiumJusquau) return false;
  return premiumJusquau.toDate().getTime() > now.getTime();
}

/**
 * Calcule la nouvelle date d'expiration après un paiement confirmé. Si un
 * abonnement est déjà actif, la nouvelle période s'ajoute à la fin de la
 * période en cours plutôt que de repartir de maintenant — un
 * renouvellement anticipé ne fait jamais perdre de jours déjà payés.
 */
export function computeNewPremiumExpiry(
  currentExpiry: Timestamp | undefined,
  now: Date = new Date(),
  durationDays: number = PREMIUM_DURATION_DAYS,
): Date {
  const base = currentExpiry && currentExpiry.toDate().getTime() > now.getTime()
    ? currentExpiry.toDate()
    : now;
  return new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
