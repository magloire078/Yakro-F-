import { describe, it, expect } from 'vitest';
import { buildOrderFromCart, COMMISSION_RATE } from './order-builder';
import type { CartItem, Restaurant, UserProfile } from './types';

const buildCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'p1',
  nom: 'Attiéké poulet',
  description: 'Plat',
  prix: 3000,
  categorie: 'Plat',
  indiceImage: 'plat-1',
  restaurantId: 'rest-1',
  quantite: 1,
  image: 'https://res.cloudinary.com/demo/image/upload/plat.jpg',
  ...overrides,
});

const userProfile: Pick<UserProfile, 'adresseParDefaut' | 'telephone'> = {
  adresseParDefaut: 'Quartier Belleville',
  telephone: '+225 0000 0000',
};

const restaurant: Restaurant = {
  id: 'rest-1',
  proprietaireId: 'owner-1',
  nom: 'Chez Test',
  cuisine: 'Locale',
  note: 4.5,
  tempsDeLivraison: 30,
  fraisDeLivraison: 500,
  image: 'https://res.cloudinary.com/demo/image/upload/r.jpg',
  indiceImage: 'rest-1',
  adresse: 'Rue Principale',
  latitude: 6.85,
  longitude: -5.27,
};

describe('buildOrderFromCart', () => {
  const baseInput = {
    user: { uid: 'user-1' },
    userProfile,
    cartItems: [buildCartItem({ quantite: 2, prix: 3000 })],
    restaurant,
    cartSubtotal: 6000,
    cartDeliveryFee: 500,
    cartTotal: 6500,
    now: new Date('2026-05-04T12:00:00.000Z'),
  };

  it('produces an order shaped exactly as the rules require', () => {
    const order = buildOrderFromCart(baseInput);
    expect(order.userId).toBe('user-1');
    expect(order.statut).toBe('Placée');
    expect(order.restaurantId).toBe('rest-1');
    expect(order.restaurateurId).toBe('owner-1');
    expect(order).not.toHaveProperty('livreurId');
    expect(order.date).toBe('2026-05-04T12:00:00.000Z');
  });

  it('computes commission and net revenue from the subtotal', () => {
    const order = buildOrderFromCart(baseInput);
    expect(order.tauxCommission).toBe(COMMISSION_RATE);
    expect(order.montantCommission).toBeCloseTo(900); // 6000 * 0.15
    expect(order.revenuNet).toBeCloseTo(5100); // 6000 - 900
  });

  it('falls back to a placeholder image when the cart item has none', () => {
    const order = buildOrderFromCart({
      ...baseInput,
      cartItems: [buildCartItem({ image: undefined })],
      cartSubtotal: 3000,
      cartTotal: 3500,
    });
    expect(order.plats[0].image).toBeTruthy();
  });

  it('replaces stale per-item picsum URLs with the canonical placeholder', () => {
    const stale = 'https://picsum.photos/200/300?random=abc';
    const order = buildOrderFromCart({
      ...baseInput,
      cartItems: [buildCartItem({ image: stale })],
      cartSubtotal: 3000,
      cartTotal: 3500,
    });
    expect(order.plats[0].image).not.toBe(stale);
  });

  it('inlines GPS coordinates when provided', () => {
    const order = buildOrderFromCart({
      ...baseInput,
      location: { latitude: 6.84, longitude: -5.28 },
    });
    expect(order.latitudeClient).toBe(6.84);
    expect(order.longitudeClient).toBe(-5.28);
    expect(order.latitudeRestaurant).toBe(6.85);
    expect(order.longitudeRestaurant).toBe(-5.27);
  });

  it('omits client coordinates when geolocation is unavailable', () => {
    const order = buildOrderFromCart({ ...baseInput, location: null });
    expect(order).not.toHaveProperty('latitudeClient');
    expect(order).not.toHaveProperty('longitudeClient');
  });

  it('throws if the cart is empty', () => {
    expect(() =>
      buildOrderFromCart({ ...baseInput, cartItems: [] }),
    ).toThrow(/panier est vide/i);
  });

  it('throws if the default delivery address is missing', () => {
    expect(() =>
      buildOrderFromCart({
        ...baseInput,
        userProfile: { adresseParDefaut: '', telephone: '' },
      }),
    ).toThrow(/adresse de livraison/i);
  });

  it('falls back to placeholder values when the restaurant is unknown', () => {
    const order = buildOrderFromCart({ ...baseInput, restaurant: null });
    expect(order.nomRestaurant).toBe('Restaurant inconnu');
    expect(order.restaurateurId).toBe('');
    expect(order).not.toHaveProperty('latitudeRestaurant');
  });
});
