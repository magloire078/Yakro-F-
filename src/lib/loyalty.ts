import type { Order } from './types';

export type LoyaltyTier = 'Bronze' | 'Argent' | 'Or';

export interface TierInfo {
  tier: LoyaltyTier;
  minPoints: number;
  nextTier?: LoyaltyTier;
  nextThreshold?: number;
  perks: string[];
  color: string;
}

export const TIERS: Record<LoyaltyTier, TierInfo> = {
  Bronze: {
    tier: 'Bronze',
    minPoints: 0,
    nextTier: 'Argent',
    nextThreshold: 100,
    perks: ['Cumul de points sur toutes vos commandes'],
    color: '#b08d57',
  },
  Argent: {
    tier: 'Argent',
    minPoints: 100,
    nextTier: 'Or',
    nextThreshold: 500,
    perks: ['-100 FCFA sur tous vos frais de livraison'],
    color: '#9ca3af',
  },
  Or: {
    tier: 'Or',
    minPoints: 500,
    perks: ['Livraison toujours offerte', 'Codes promo exclusifs'],
    color: '#eab308',
  },
};

/** Coefficient : 1 point par 100 FCFA de sous-total (avant livraison et réduction). */
export const POINTS_PER_100_FCFA = 1;

export const computeOrderPoints = (subtotal: number): number => {
  return Math.floor(subtotal / 100) * POINTS_PER_100_FCFA;
};

export const computePointsFromOrders = (orders: Order[], userId: string): number => {
  return orders
    .filter(o => o.userId === userId && o.statut === 'Livrée')
    .reduce((sum, o) => sum + (o.pointsGagnes ?? computeOrderPoints(o.sousTotal)), 0);
};

export const getTierForPoints = (points: number): TierInfo => {
  if (points >= TIERS.Or.minPoints) return TIERS.Or;
  if (points >= TIERS.Argent.minPoints) return TIERS.Argent;
  return TIERS.Bronze;
};

/**
 * Calcule la réduction de livraison liée au tier de fidélité.
 * Argent : -100 FCFA, Or : 100% offerts.
 */
export const computeLoyaltyDeliveryDiscount = (
  tier: LoyaltyTier,
  deliveryFee: number
): number => {
  if (tier === 'Or') return deliveryFee;
  if (tier === 'Argent') return Math.min(100, deliveryFee);
  return 0;
};
