'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { priceCartItem, computeCartSubtotal } from '@/lib/order-pricing';
import { validateCoupon } from '@/lib/coupon-validation';
import { buildOrderFromCart } from '@/lib/order-builder';
import type { Coupon, MenuItem, PaymentMode, Restaurant, UserProfile } from '@/lib/types';

export interface CreateOrderItemInput {
  menuItemId: string;
  quantite: number;
  accompagnementNom?: string;
  boissonNom?: string;
}

export interface CreateOrderInput {
  idToken: string;
  restaurantId: string;
  items: CreateOrderItemInput[];
  paymentMode: PaymentMode;
  couponCode?: string;
  location?: { latitude: number; longitude: number } | null;
}

export type CreateOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

/**
 * Seule voie de création d'une commande. Le client ne transmet plus que
 * des ids + quantités + noms d'options ; tous les prix (plats, options,
 * frais de livraison) et la validité du coupon sont relus/revérifiés ici
 * depuis Firestore via l'Admin SDK avant d'écrire quoi que ce soit —
 * fermant la brèche que `firestore.rules` ne pouvait pas fermer seule
 * (impossible d'y sommer un tableau de longueur variable pour vérifier
 * `sousTotal`). `/commandes` `allow create` est désormais `if false`.
 */
export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { idToken, restaurantId, items, paymentMode, couponCode, location } = input;

  if (!idToken || !restaurantId || !items || items.length === 0) {
    return { success: false, error: 'Paramètres manquants.' };
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error('createOrderAction: token invalide', err);
    return { success: false, error: 'Authentification invalide.' };
  }

  const adminDb = getAdminDb();

  const userSnap = await adminDb.collection('utilisateurs').doc(uid).get();
  if (!userSnap.exists) {
    return { success: false, error: 'Profil utilisateur introuvable.' };
  }
  const userProfile = userSnap.data() as UserProfile;
  if (!userProfile.adresseParDefaut) {
    return { success: false, error: 'Veuillez définir une adresse de livraison par défaut dans votre profil.' };
  }

  const restaurantSnap = await adminDb.collection('restaurants').doc(restaurantId).get();
  if (!restaurantSnap.exists) {
    return { success: false, error: 'Restaurant introuvable.' };
  }
  const restaurant = { id: restaurantSnap.id, ...(restaurantSnap.data() as Omit<Restaurant, 'id'>) };
  if (restaurant.suspendu) {
    return { success: false, error: "Ce restaurant n'accepte plus de commandes pour le moment." };
  }

  const menuItemRefs = items.map((item) => adminDb.collection('plats').doc(item.menuItemId));
  const menuItemSnaps = menuItemRefs.length > 0 ? await adminDb.getAll(...menuItemRefs) : [];

  const cartItems = [];
  for (let i = 0; i < items.length; i++) {
    const itemInput = items[i];
    const snap = menuItemSnaps[i];
    if (!snap.exists) {
      return { success: false, error: 'Un des plats commandés est introuvable.' };
    }
    const menuItem = { id: snap.id, ...(snap.data() as Omit<MenuItem, 'id'>) };
    if (menuItem.restaurantId !== restaurantId) {
      return { success: false, error: 'Un des plats ne correspond pas à ce restaurant.' };
    }
    const priced = priceCartItem(itemInput, menuItem);
    if (!priced.success) {
      return { success: false, error: priced.error };
    }
    cartItems.push(priced.item);
  }

  const cartSubtotal = computeCartSubtotal(cartItems);
  const cartDeliveryFee = restaurant.fraisDeLivraison || 0;
  const cartTotal = cartSubtotal + cartDeliveryFee;

  let coupon: { code: string; montantReduction: number } | null = null;
  if (couponCode) {
    const couponSnap = await adminDb.collection('coupons').doc(couponCode.trim().toUpperCase()).get();
    if (!couponSnap.exists) {
      return { success: false, error: 'Code promo introuvable.' };
    }
    const couponData = couponSnap.data() as Coupon;
    const validation = validateCoupon(couponData, restaurantId, cartSubtotal);
    if (!validation.valid) {
      return { success: false, error: validation.error ?? 'Code promo invalide.' };
    }
    coupon = { code: couponData.code, montantReduction: validation.discount };
  }

  let order;
  try {
    order = buildOrderFromCart({
      user: { uid },
      userProfile,
      cartItems,
      restaurant,
      cartSubtotal,
      cartDeliveryFee,
      cartTotal,
      paymentMode,
      coupon,
      location,
    });
  } catch (err) {
    console.error('createOrderAction: échec de la construction de la commande', err);
    return { success: false, error: err instanceof Error ? err.message : 'Commande invalide.' };
  }

  const orderRef = adminDb.collection('commandes').doc();
  await orderRef.set(order);

  if (order.restaurateurId) {
    try {
      await adminDb.collection('notifications').add({
        userId: order.restaurateurId,
        type: 'NEW_ORDER',
        orderId: orderRef.id,
        total: order.total,
        restaurantId: order.restaurantId,
        date: new Date(),
        read: false,
      });
    } catch (err) {
      // La notification est secondaire : une commande valide ne doit jamais
      // échouer à cause d'un souci d'écriture sur /notifications.
      console.error('createOrderAction: échec de la notification NEW_ORDER', err);
    }
  }

  return { success: true, orderId: orderRef.id };
}
