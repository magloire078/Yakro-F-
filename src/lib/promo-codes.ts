import type { PromoCode } from './types';

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'BIENVENUE',
    type: 'percentage',
    valeur: 15,
    minimumCommande: 2000,
    description: '15% de réduction sur votre première commande (min. 2000 FCFA).',
  },
  {
    code: 'YAKRO500',
    type: 'fixed',
    valeur: 500,
    minimumCommande: 3000,
    description: '500 FCFA de réduction (min. 3000 FCFA).',
  },
  {
    code: 'LIVRAISONFREE',
    type: 'freeDelivery',
    valeur: 0,
    minimumCommande: 5000,
    description: 'Livraison gratuite (min. 5000 FCFA).',
  },
];

export interface PromoApplication {
  code: PromoCode;
  reduction: number; // sur le sous-total (FCFA)
  fraisLivraisonOffert: boolean;
}

export const findPromoCode = (code: string): PromoCode | undefined => {
  const normalized = code.trim().toUpperCase();
  return PROMO_CODES.find(p => p.code === normalized);
};

export const applyPromoCode = (
  code: string,
  subtotal: number,
  deliveryFee: number
): { ok: true; application: PromoApplication } | { ok: false; error: string } => {
  const promo = findPromoCode(code);
  if (!promo) return { ok: false, error: 'Code promo invalide.' };
  if (promo.minimumCommande && subtotal < promo.minimumCommande) {
    return { ok: false, error: `Minimum requis : ${promo.minimumCommande.toLocaleString('fr-FR')} FCFA.` };
  }
  if (promo.type === 'percentage') {
    const reduction = Math.round((subtotal * promo.valeur) / 100);
    return { ok: true, application: { code: promo, reduction, fraisLivraisonOffert: false } };
  }
  if (promo.type === 'fixed') {
    const reduction = Math.min(promo.valeur, subtotal);
    return { ok: true, application: { code: promo, reduction, fraisLivraisonOffert: false } };
  }
  return { ok: true, application: { code: promo, reduction: 0, fraisLivraisonOffert: deliveryFee > 0 } };
};
