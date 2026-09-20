import { describe, it, expect } from 'vitest';
import { priceCartItem, computeCartSubtotal } from './order-pricing';
import type { MenuItem } from './types';

const baseMenuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 'p1',
  nom: 'Attiéké Poisson',
  description: 'Attiéké, poisson braisé',
  prix: 3000,
  categorie: 'Plat',
  indiceImage: 'plat-1',
  restaurantId: 'rest-1',
  ...overrides,
});

describe('priceCartItem', () => {
  it('prices a simple item from real menu data, ignoring any client-supplied price', () => {
    const result = priceCartItem({ menuItemId: 'p1', quantite: 2 }, baseMenuItem());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item.prix).toBe(3000);
    expect(result.item.quantite).toBe(2);
    expect(result.item.accompagnementSelectionne).toBeUndefined();
    expect(result.item.boissonSelectionnee).toBeUndefined();
  });

  it('rejects a zero or negative quantity', () => {
    const result = priceCartItem({ menuItemId: 'p1', quantite: 0 }, baseMenuItem());
    expect(result.success).toBe(false);
  });

  it('rejects a non-finite quantity', () => {
    const result = priceCartItem({ menuItemId: 'p1', quantite: NaN }, baseMenuItem());
    expect(result.success).toBe(false);
  });

  it('resolves a valid side option from the real menu item', () => {
    const menuItem = baseMenuItem({
      accompagnementsDisponibles: [{ nom: 'Alloco', prix: 500 }],
    });
    const result = priceCartItem({ menuItemId: 'p1', quantite: 1, accompagnementNom: 'Alloco' }, menuItem);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item.accompagnementSelectionne).toEqual({ nom: 'Alloco', prix: 500 });
  });

  it('rejects a side option that does not exist on the menu item', () => {
    const menuItem = baseMenuItem({
      accompagnementsDisponibles: [{ nom: 'Alloco', prix: 500 }],
    });
    const result = priceCartItem({ menuItemId: 'p1', quantite: 1, accompagnementNom: 'Frites' }, menuItem);
    expect(result.success).toBe(false);
  });

  it('resolves a valid drink option from the real menu item', () => {
    const menuItem = baseMenuItem({
      boissonsDisponibles: [{ nom: 'Coca', prix: 700 }],
    });
    const result = priceCartItem({ menuItemId: 'p1', quantite: 1, boissonNom: 'Coca' }, menuItem);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item.boissonSelectionnee).toEqual({ nom: 'Coca', prix: 700 });
  });

  it('rejects a drink option that does not exist on the menu item', () => {
    const menuItem = baseMenuItem({
      boissonsDisponibles: [{ nom: 'Coca', prix: 700 }],
    });
    const result = priceCartItem({ menuItemId: 'p1', quantite: 1, boissonNom: 'Sprite' }, menuItem);
    expect(result.success).toBe(false);
  });

  it('falls back to the placeholder image when none is set', () => {
    const result = priceCartItem({ menuItemId: 'p1', quantite: 1 }, baseMenuItem({ image: undefined }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item.image).toBeTruthy();
  });
});

describe('computeCartSubtotal', () => {
  it('sums price × quantity across items', () => {
    const priced = priceCartItem({ menuItemId: 'p1', quantite: 2 }, baseMenuItem());
    expect(priced.success).toBe(true);
    if (!priced.success) return;
    expect(computeCartSubtotal([priced.item])).toBe(6000);
  });

  it('includes side and drink prices in the subtotal', () => {
    const menuItem = baseMenuItem({
      accompagnementsDisponibles: [{ nom: 'Alloco', prix: 500 }],
      boissonsDisponibles: [{ nom: 'Coca', prix: 700 }],
    });
    const priced = priceCartItem(
      { menuItemId: 'p1', quantite: 2, accompagnementNom: 'Alloco', boissonNom: 'Coca' },
      menuItem,
    );
    expect(priced.success).toBe(true);
    if (!priced.success) return;
    // (3000 + 500 + 700) * 2 = 8400
    expect(computeCartSubtotal([priced.item])).toBe(8400);
  });

  it('returns 0 for an empty cart', () => {
    expect(computeCartSubtotal([])).toBe(0);
  });
});
