/** 1000 FCFA commandés = 10 points de fidélité. */
export const LOYALTY_POINTS_PER_1000_FCFA = 10;

/** Bonus versé au parrain à la première commande livrée de son filleul. */
export const REFERRAL_BONUS_POINTS = 50;

/**
 * Points gagnés par le client sur une commande, calculés sur le montant
 * total (frais de livraison inclus) arrondi au millier inférieur.
 */
export function computeLoyaltyPoints(orderTotal: number): number {
  return Math.floor(orderTotal / 1000) * LOYALTY_POINTS_PER_1000_FCFA;
}
