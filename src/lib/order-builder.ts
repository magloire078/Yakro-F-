import type { CartItem, Order, Restaurant, UserProfile } from './types';
import { getPlaceholderImage } from './placeholder-images';

export const COMMISSION_RATE = 0.15;

interface BuildOrderInput {
  user: { uid: string };
  userProfile: Pick<UserProfile, 'adresseParDefaut' | 'telephone'>;
  cartItems: CartItem[];
  restaurant: Restaurant | null | undefined;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  /** Optional GPS coordinates of the client at order time. */
  location?: { latitude: number; longitude: number } | null;
  /** Injectable for tests; defaults to current time. */
  now?: Date;
}

/**
 * Pure function that produces the `Omit<Order, 'id'>` payload written to
 * Firestore by `placeOrder`. Extracted from `cart-context.tsx` so the
 * shape can be unit-tested and validated against `firestore.rules` in
 * the rules emulator suite without spinning up React or the browser
 * geolocation API.
 */
export function buildOrderFromCart(input: BuildOrderInput): Omit<Order, 'id'> {
  const {
    user, userProfile, cartItems, restaurant,
    cartSubtotal, cartDeliveryFee, cartTotal,
    location, now = new Date(),
  } = input;

  if (cartItems.length === 0) {
    throw new Error("Votre panier est vide.");
  }
  if (!userProfile.adresseParDefaut) {
    throw new Error("Veuillez définir une adresse de livraison par défaut dans votre profil.");
  }

  const restaurantId = cartItems[0].restaurantId;
  const commissionAmount = cartSubtotal * COMMISSION_RATE;
  const netRevenue = cartSubtotal - commissionAmount;

  const itemsForOrder = cartItems.map((item) => {
    const placeholder = getPlaceholderImage(item.indiceImage);
    const image = item.image && !item.image.includes('picsum.photos')
      ? item.image
      : placeholder.url;
    return { ...item, image };
  });

  return {
    userId: user.uid,
    plats: itemsForOrder,
    sousTotal: cartSubtotal,
    fraisDeLivraison: cartDeliveryFee,
    total: cartTotal,
    tauxCommission: COMMISSION_RATE,
    montantCommission: commissionAmount,
    revenuNet: netRevenue,
    date: now.toISOString(),
    nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
    restaurantId,
    restaurateurId: restaurant?.proprietaireId || '',
    statut: 'Placée',
    adresseClient: userProfile.adresseParDefaut,
    adresseRestaurant: restaurant?.adresse || 'Adresse du restaurant non spécifiée',
    telephoneClient: userProfile.telephone || 'Numéro non spécifié',
    ...(location && {
      latitudeClient: location.latitude,
      longitudeClient: location.longitude,
    }),
    ...(restaurant?.latitude !== undefined && { latitudeRestaurant: restaurant.latitude }),
    ...(restaurant?.longitude !== undefined && { longitudeRestaurant: restaurant.longitude }),
  };
}
