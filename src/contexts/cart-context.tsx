'use client';

import * as React from 'react';
import type { CartItem, Coupon, Order, PaymentMode } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';
import { buildOrderFromCart } from '@/lib/order-builder';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { notifyNewOrderAction } from '@/app/actions/notification-actions';
import { initiateMobileMoneyPaymentAction } from '@/app/actions/payment-actions';

interface PlaceOrderResult {
  success: boolean;
  error?: FirestorePermissionError | Error;
  /**
   * Présent uniquement pour un paiement Mobile Money réussi : l'appelant
   * doit rediriger le navigateur vers cette URL pour que le client
   * complète le paiement sur la page hébergée CinetPay.
   */
  paymentUrl?: string;
}

interface AppliedCoupon {
  code: string;
  montantReduction: number;
}

interface ApplyCouponResult {
  success: boolean;
  error?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'image'>) => void;
  removeFromCart: (itemId: string, side?: string, drink?: string) => void;
  updateQuantity: (itemId: string, quantity: number, side?: string, drink?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartCount: number;
  appliedCoupon: AppliedCoupon | null;
  cartDiscount: number;
  applyCoupon: (code: string) => Promise<ApplyCouponResult>;
  removeCoupon: () => void;
  placeOrder: (paymentMode: PaymentMode) => Promise<PlaceOrderResult>;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const getInitialCart = (): CartItem[] => {
  return []; // Start empty for SSR safety
};

const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      }
    );
  });
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(getInitialCart);
  const [appliedCoupon, setAppliedCoupon] = React.useState<AppliedCoupon | null>(null);
  const { getRestaurant } = useData();
  const { user, userProfile } = useAuth();
  const { db } = useFirebase();

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        const item = window.localStorage.getItem('yakro-fe-cart');
        if (item) {
          setCartItems(JSON.parse(item));
        }
      }
    } catch (error) {
      console.warn('Error reading from localStorage cart', error);
    }
  }, []);

  // Sync to localStorage on changes
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        if (cartItems.length > 0) {
          window.localStorage.setItem('yakro-fe-cart', JSON.stringify(cartItems));
        } else {
          window.localStorage.setItem('yakro-fe-cart', JSON.stringify([]));
        }
      }
    } catch (error) {
      console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);

  const addToCart = React.useCallback((item: Omit<CartItem, 'image'>) => {
    if (cartItems.length > 0 && cartItems[0].restaurantId !== item.restaurantId) {
      if (confirm("Votre panier contient déjà des plats d'un autre restaurant. Voulez-vous le vider pour commander ici ?")) {
        setCartItems([{ ...item, quantite: 1 }]);
        setAppliedCoupon(null);
      }
      return;
    }

    setCartItems(prevItems => {
      const uniqueItemKey = `${item.id}-${item.accompagnementSelectionne?.nom || 'none'}-${item.boissonSelectionnee?.nom || 'none'}`;

      const existingItem = prevItems.find(i =>
        `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}` === uniqueItemKey
      );

      if (existingItem) {
        return prevItems.map(i =>
          `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}` === uniqueItemKey
            ? { ...i, quantite: i.quantite + item.quantite }
            : i
        );
      }
      return [...prevItems, item];
    });
  }, [cartItems]);

  const getUniqueKey = React.useCallback((itemId: string, side?: string, drink?: string) => {
    return `${itemId}-${side || 'none'}-${drink || 'none'}`;
  }, []);

  const removeFromCart = React.useCallback((itemId: string, side?: string, drink?: string) => {
    const keyToRemove = getUniqueKey(itemId, side, drink);
    setCartItems(prevItems => prevItems.filter(i =>
      getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) !== keyToRemove
    ));
  }, [getUniqueKey]);

  const updateQuantity = React.useCallback((itemId: string, quantity: number, side?: string, drink?: string) => {
    const keyToUpdate = getUniqueKey(itemId, side, drink);
    if (quantity <= 0) {
      removeFromCart(itemId, side, drink);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => (getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) === keyToUpdate ? { ...i, quantite: quantity } : i))
      );
    }
  }, [getUniqueKey, removeFromCart]);

  const clearCart = React.useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
  }, []);

  const cartSubtotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.prix;
      const sidePrice = item.accompagnementSelectionne?.prix || 0;
      const drinkPrice = item.boissonSelectionnee?.prix || 0;
      return total + (itemPrice + sidePrice + drinkPrice) * item.quantite;
    }, 0);
  }, [cartItems]);

  const cartDeliveryFee = React.useMemo(() => {
    if (cartItems.length === 0) return 0;
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);
    return restaurant?.fraisDeLivraison || 0;
  }, [cartItems, getRestaurant]);

  const cartTotal = React.useMemo(() => {
    return cartSubtotal + cartDeliveryFee;
  }, [cartSubtotal, cartDeliveryFee]);

  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantite, 0);
  }, [cartItems]);

  const cartDiscount = appliedCoupon?.montantReduction ?? 0;

  /**
   * Vérifie un code promo auprès de Firestore et, s'il est valide pour le
   * restaurant du panier en cours, calcule la réduction et la mémorise
   * localement. La validation finale et non contournable reste faite par
   * firestore.rules à la création de la commande — cette étape ne sert
   * qu'à donner un retour immédiat au client.
   */
  const applyCoupon = React.useCallback(async (rawCode: string): Promise<ApplyCouponResult> => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, error: 'Entrez un code promo.' };
    }
    if (cartItems.length === 0) {
      return { success: false, error: 'Votre panier est vide.' };
    }

    const restaurantId = cartItems[0].restaurantId;

    try {
      const snap = await getDoc(doc(db, 'coupons', code));
      if (!snap.exists()) {
        return { success: false, error: 'Code promo introuvable.' };
      }
      const coupon = snap.data() as Coupon;

      if (coupon.restaurantId !== restaurantId) {
        return { success: false, error: "Ce code n'est pas valable pour ce restaurant." };
      }
      if (!coupon.actif) {
        return { success: false, error: "Ce code promo n'est plus actif." };
      }
      const expiration = coupon.dateExpiration instanceof Timestamp
        ? coupon.dateExpiration.toDate()
        : new Date(coupon.dateExpiration as unknown as string);
      if (expiration.getTime() < Date.now()) {
        return { success: false, error: 'Ce code promo a expiré.' };
      }
      if (coupon.montantMinimum && cartSubtotal < coupon.montantMinimum) {
        return {
          success: false,
          error: `Commande minimum de ${coupon.montantMinimum.toLocaleString('fr-FR')} FCFA requise pour ce code.`,
        };
      }

      const rawDiscount = coupon.type === 'montant_fixe'
        ? coupon.valeur
        : (cartSubtotal * coupon.valeur) / 100;
      const montantReduction = Math.min(Math.round(rawDiscount), cartSubtotal);

      setAppliedCoupon({ code, montantReduction });
      return { success: true };
    } catch (err) {
      console.error('applyCoupon: échec de la validation', err);
      return { success: false, error: 'Impossible de vérifier ce code pour le moment.' };
    }
  }, [cartItems, cartSubtotal, db]);

  const removeCoupon = React.useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const placeOrder = React.useCallback(async (paymentMode: PaymentMode) => {
    if (!user || !userProfile) {
      throw new Error("Vous devez être connecté pour passer une commande.");
    }

    const location = await getUserLocation();
    const restaurant = getRestaurant(cartItems[0]?.restaurantId ?? '');

    const newOrder: Omit<Order, 'id'> = buildOrderFromCart({
      user,
      userProfile,
      cartItems,
      restaurant,
      cartSubtotal,
      cartDeliveryFee,
      cartTotal,
      paymentMode,
      coupon: appliedCoupon,
      location,
    });

    const orderDocRef = doc(collection(db, "commandes"));

    try {
      await setDoc(orderDocRef, newOrder);
      clearCart();
      window.dispatchEvent(new CustomEvent('place-order'));

      const idToken = await user.getIdToken();

      // Fire-and-forget the NEW_ORDER notification — its failure should
      // never block the order from being considered placed.
      try {
        const result = await notifyNewOrderAction(orderDocRef.id, idToken);
        if (!result.success) {
          console.error('notifyNewOrderAction failed:', result.error);
        }
      } catch (err) {
        console.error('notifyNewOrderAction threw:', err);
      }

      if (paymentMode === 'especes') {
        return { success: true };
      }

      // Mobile Money : la commande existe déjà (paiement.statut =
      // 'en_attente'). On ouvre la session CinetPay et on renvoie l'URL
      // de checkout à l'appelant pour rediriger le client. Un échec ici
      // n'annule pas la commande — le client peut retenter le paiement
      // depuis le suivi de commande.
      try {
        const paymentResult = await initiateMobileMoneyPaymentAction(orderDocRef.id, idToken);
        if (!paymentResult.success) {
          return { success: true, error: new Error(paymentResult.error) };
        }
        return { success: true, paymentUrl: paymentResult.paymentUrl };
      } catch (err) {
        console.error('initiateMobileMoneyPaymentAction threw:', err);
        return { success: true, error: err instanceof Error ? err : new Error(String(err)) };
      }
    } catch {
      const permissionError = new FirestorePermissionError({
        path: orderDocRef.path,
        operation: 'create',
        requestResourceData: newOrder,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [user, userProfile, cartItems, cartSubtotal, cartDeliveryFee, cartTotal, appliedCoupon, getRestaurant, clearCart, db]);

  const value = React.useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    cartCount,
    appliedCoupon,
    cartDiscount,
    applyCoupon,
    removeCoupon,
    placeOrder
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartTotal, cartCount, appliedCoupon, cartDiscount, applyCoupon, removeCoupon, placeOrder]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
