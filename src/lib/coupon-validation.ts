import type { Coupon } from './types';

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  error?: string;
}

/**
 * Valide un coupon pour une commande donnée et calcule la réduction qui en
 * résulte. Fonction pure, partagée entre l'aperçu client (cart-context.tsx,
 * pour un retour immédiat à la saisie du code) et la création de commande
 * côté serveur (create-order-action.ts, qui fait foi) — un seul endroit qui
 * décide ce qu'un coupon autorise.
 */
export function validateCoupon(
  coupon: Coupon,
  restaurantId: string,
  sousTotal: number,
  now: Date = new Date(),
): CouponValidationResult {
  if (coupon.restaurantId !== restaurantId) {
    return { valid: false, discount: 0, error: "Ce code n'est pas valable pour ce restaurant." };
  }
  if (!coupon.actif) {
    return { valid: false, discount: 0, error: "Ce code promo n'est plus actif." };
  }
  if (coupon.dateExpiration.toDate().getTime() < now.getTime()) {
    return { valid: false, discount: 0, error: 'Ce code promo a expiré.' };
  }
  if (coupon.montantMinimum && sousTotal < coupon.montantMinimum) {
    return {
      valid: false,
      discount: 0,
      error: `Commande minimum de ${coupon.montantMinimum.toLocaleString('fr-FR')} FCFA requise pour ce code.`,
    };
  }

  const rawDiscount = coupon.type === 'montant_fixe'
    ? coupon.valeur
    : (sousTotal * coupon.valeur) / 100;
  const discount = Math.min(Math.round(rawDiscount), sousTotal);

  return { valid: true, discount };
}
