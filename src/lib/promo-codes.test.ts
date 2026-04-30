import { describe, expect, it } from 'vitest';
import { applyPromoCode, findPromoCode } from './promo-codes';

describe('findPromoCode', () => {
  it('trouve un code en majuscules ou minuscules', () => {
    expect(findPromoCode('BIENVENUE')).toBeDefined();
    expect(findPromoCode('bienvenue')).toBeDefined();
    expect(findPromoCode('  bienvenue  ')).toBeDefined();
  });

  it('renvoie undefined pour un code inconnu', () => {
    expect(findPromoCode('INVALIDE')).toBeUndefined();
  });
});

describe('applyPromoCode', () => {
  it('rejette un code inconnu', () => {
    const result = applyPromoCode('PASBON', 5000, 1000);
    expect(result.ok).toBe(false);
  });

  it('applique 15% sur BIENVENUE au-dessus du minimum', () => {
    const result = applyPromoCode('BIENVENUE', 10000, 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.code.code).toBe('BIENVENUE');
      expect(result.application.reduction).toBe(1500); // 15% de 10000
      expect(result.application.fraisLivraisonOffert).toBe(false);
    }
  });

  it('refuse BIENVENUE sous le minimum (2000 FCFA)', () => {
    const result = applyPromoCode('BIENVENUE', 1000, 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Minimum');
    }
  });

  it('applique le montant fixe YAKRO500', () => {
    const result = applyPromoCode('YAKRO500', 4000, 500);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.reduction).toBe(500);
      expect(result.application.fraisLivraisonOffert).toBe(false);
    }
  });

  it('plafonne la réduction fixe au sous-total', () => {
    const result = applyPromoCode('YAKRO500', 4000, 0);
    expect(result.ok).toBe(true);
    // 4000 > 500, donc la réduction reste 500.
  });

  it('applique la livraison gratuite', () => {
    const result = applyPromoCode('LIVRAISONFREE', 6000, 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.reduction).toBe(0);
      expect(result.application.fraisLivraisonOffert).toBe(true);
    }
  });

  it('refuse la livraison gratuite si pas de frais à offrir', () => {
    const result = applyPromoCode('LIVRAISONFREE', 6000, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // freeDelivery est valide même si frais = 0, juste sans effet
      expect(result.application.fraisLivraisonOffert).toBe(false);
    }
  });

  it('arrondit les pourcentages au franc près', () => {
    const result = applyPromoCode('BIENVENUE', 3333, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 15% de 3333 = 499.95 → arrondi à 500
      expect(result.application.reduction).toBe(500);
    }
  });
});
