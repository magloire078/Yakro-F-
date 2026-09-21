import type { CartItem, Order, PaymentMode, Restaurant, UserProfile } from './types';
import { getPlaceholderImage } from './placeholder-images';
import { isPremiumActive } from './premium';

export const COMMISSION_RATE = 0.15;

interface AppliedCoupon {
  code: string;
  montantReduction: number;
}

interface BuildOrderInput {
  user: { uid: string };
  userProfile: Pick<UserProfile, 'adresseParDefaut' | 'telephone' | 'premiumJusquau'>;
  cartItems: CartItem[];
  restaurant: Restaurant | null | undefined;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  paymentMode: PaymentMode;
  /**
   * Code promo déjà validé (montantReduction calculé et plafonné par
   * l'appelant) — le restaurant absorbe la réduction sur sa part, la
   * commission Yakro Fê reste calculée sur le sous-total plein.
   */
  coupon?: AppliedCoupon | null;
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
    cartSubtotal, cartDeliveryFee, cartTotal, paymentMode,
    coupon, location, now = new Date(),
  } = input;

  if (cartItems.length === 0) {
    throw new Error("Votre panier est vide.");
  }
  if (!userProfile.adresseParDefaut) {
    throw new Error("Veuillez définir une adresse de livraison par défaut dans votre profil.");
  }

  const restaurantId = cartItems[0].restaurantId;
  const commissionAmount = cartSubtotal * COMMISSION_RATE;
  // Le rabais est plafonné au sous-total : jamais de commande à revenu
  // net négatif pour le restaurant, même si un appelant transmettait une
  // réduction mal calculée.
  const discount = coupon ? Math.max(0, Math.min(coupon.montantReduction, cartSubtotal)) : 0;
  const netRevenue = cartSubtotal - commissionAmount - discount;
  const discountedTotal = cartTotal - discount;

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
    total: discountedTotal,
    tauxCommission: COMMISSION_RATE,
    montantCommission: commissionAmount,
    revenuNet: netRevenue,
    date: now.toISOString(),
    nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
    restaurantId,
    restaurateurId: restaurant?.proprietaireId || '',
    statut: 'Placée',
    paiement: {
      mode: paymentMode,
      statut: paymentMode === 'especes' ? 'a_la_livraison' : 'en_attente',
      montant: discountedTotal,
    },
    adresseClient: userProfile.adresseParDefaut,
    adresseRestaurant: restaurant?.adresse || 'Adresse du restaurant non spécifiée',
    telephoneClient: userProfile.telephone || 'Numéro non spécifié',
    ...(discount > 0 && coupon && {
      codePromo: { code: coupon.code, montantReduction: discount },
    }),
    ...(isPremiumActive(userProfile.premiumJusquau, now) && { prioritaire: true }),
    ...(location && {
      latitudeClient: location.latitude,
      longitudeClient: location.longitude,
    }),
    ...(restaurant?.latitude !== undefined && { latitudeRestaurant: restaurant.latitude }),
    ...(restaurant?.longitude !== undefined && { longitudeRestaurant: restaurant.longitude }),
  };
}
