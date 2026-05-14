'use client';

import * as React from 'react';
import type { CartItem, Order } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { notifyNewOrderAction } from '@/app/actions/notification-actions';
import { getCurrentLocation } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';

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
  placeOrder: () => Promise<{ success: boolean; error?: FirestorePermissionError | Error }>;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const getInitialCart = (): CartItem[] => {
  return []; // Start empty for SSR safety
};

const COMMISSION_RATE = 0.15; // 15% commission

const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return getCurrentLocation()
    .then((coords) => coords)
    .catch((error) => {
      console.warn('Geolocation unavailable for placeOrder:', error?.message ?? error);
      return null;
    });
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(getInitialCart);
  const { getRestaurant } = useData();
  const { user, userProfile } = useAuth();
  const { db } = useFirebase();
  const { toast } = useToast();

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

  const placeOrder = React.useCallback(async () => {
    if (!user || !userProfile) {
      throw new Error("Vous devez être connecté pour passer une commande.");
    }
    if (cartItems.length === 0) {
      throw new Error("Votre panier est vide.");
    }
    if (!userProfile.adresseParDefaut) {
      throw new Error("Veuillez définir une adresse de livraison par défaut dans votre profil.");
    }

    const location = await getUserLocation();
    if (!location) {
      // Geolocation refused, unsupported, or timed out. The order still
      // goes through using the textual address, but the live tracking map
      // will degrade to "restaurant only".
      toast({
        title: 'Position GPS indisponible',
        description: "Votre commande passe sans suivi cartographique. Activez la géolocalisation pour le suivi temps réel.",
      });
    }
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);

    const commissionAmount = cartSubtotal * COMMISSION_RATE;
    const netRevenue = cartSubtotal - commissionAmount;

    const itemsForOrder = cartItems.map(item => {
      const placeholder = getPlaceholderImage(item.indiceImage);
      const image = (item.image && !item.image.includes('picsum.photos')) ? item.image : placeholder.url;
      return {
        ...item,
        image,
      }
    });

    const newOrder: Omit<Order, 'id'> = {
      userId: user.uid,
      plats: itemsForOrder,
      sousTotal: cartSubtotal,
      fraisDeLivraison: cartDeliveryFee,
      total: cartTotal,
      tauxCommission: COMMISSION_RATE,
      montantCommission: commissionAmount,
      revenuNet: netRevenue,
      date: new Date().toISOString(),
      nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
      restaurantId: restaurantId,
      restaurateurId: restaurant?.proprietaireId || '',
      statut: 'Placée',
      adresseClient: userProfile.adresseParDefaut,
      adresseRestaurant: restaurant?.adresse || 'Adresse du restaurant non spécifiée',
      telephoneClient: userProfile.telephone || 'Numéro non spécifié',
      ...(location && {
        latitudeClient: location.latitude,
        longitudeClient: location.longitude,
      }),
      ...(restaurant?.latitude && { latitudeRestaurant: restaurant.latitude }),
      ...(restaurant?.longitude && { longitudeRestaurant: restaurant.longitude }),
    };

    const orderDocRef = doc(collection(db, "commandes"));

    try {
      await setDoc(orderDocRef, newOrder);
      clearCart();
      window.dispatchEvent(new CustomEvent('place-order'));
      // Fire-and-forget the NEW_ORDER notification — its failure should
      // never block the order from being considered placed.
      try {
        const idToken = await user.getIdToken();
        const result = await notifyNewOrderAction(orderDocRef.id, idToken);
        if (!result.success) {
          console.error('notifyNewOrderAction failed:', result.error);
        }
      } catch (err) {
        console.error('notifyNewOrderAction threw:', err);
      }
      return { success: true };
    } catch {
      const permissionError = new FirestorePermissionError({
        path: orderDocRef.path,
        operation: 'create',
        requestResourceData: newOrder,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: permissionError };
    }
  }, [user, userProfile, cartItems, cartSubtotal, cartDeliveryFee, cartTotal, getRestaurant, clearCart, db, toast]);

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
    placeOrder
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartTotal, cartCount, placeOrder]);

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
