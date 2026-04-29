import type { UserProfile } from './types';

/** Réduction filleul (FCFA) appliquée sur sa première commande. */
export const FILLEUL_DISCOUNT_FCFA = 1000;

/** Bonus en points de fidélité crédité au parrain quand le filleul commande. */
export const PARRAIN_BONUS_POINTS = 500;

/** Sous-total minimum pour pouvoir bénéficier de la réduction filleul. */
export const FILLEUL_MIN_SUBTOTAL = 3000;

const PREFIX = 'YAK';

/** Génère un code déterministe à partir de l'UID, sans collision pour un même UID. */
export const generateReferralCode = (uid: string, nom?: string | null): string => {
  const base = (nom || uid).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const namePart = base.slice(0, 4).padEnd(4, 'X');
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const codePart = hash.toString(36).slice(0, 4).toUpperCase().padStart(4, '0');
  return `${PREFIX}-${namePart}-${codePart}`;
};

const CODE_REGEX = /^YAK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const isValidReferralCodeFormat = (code: string): boolean => {
  return CODE_REGEX.test(code.trim().toUpperCase());
};

export const normalizeReferralCode = (code: string): string =>
  code.trim().toUpperCase();

export const canUseFilleulDiscount = (profile: UserProfile | null, hasDeliveredOrders: boolean): boolean => {
  if (!profile) return false;
  if (!profile.parraineParCode) return false;
  if (profile.bonusParrainageUtilise) return false;
  // Empêche un utilisateur de se parrainer lui-même.
  if (profile.codeParrainage && profile.parraineParCode === profile.codeParrainage) return false;
  // Le bonus n'est valable que pour un nouveau client (aucune commande livrée).
  if (hasDeliveredOrders) return false;
  return true;
};

export const buildShareMessage = (code: string): string => {
  return `Yakro Fê : la livraison de repas à Yamoussoukro ! Crée ton compte avec mon code ${code} et profite de ${FILLEUL_DISCOUNT_FCFA.toLocaleString('fr-FR')} FCFA offerts sur ta première commande.`;
};
