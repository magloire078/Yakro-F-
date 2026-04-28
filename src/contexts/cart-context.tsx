'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order, MenuOption } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { applyPromoCode, type PromoApplication } from '@/lib/promo-codes';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'image'>) => void;
  reorderItems: (items: Omit<CartItem, 'image'>[]) => void;
  removeFromCart: (itemId: string, side?: string, drink?: string) => void;
  updateQuantity: (itemId: string, quantity: number, side?: string, drink?: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartDiscount: number;
  cartTotal: number;
  cartCount: number;
  promoCode: PromoApplication | null;
  applyPromo: (code: string) => { ok: true } | { ok: false; error: string };
  removePromo: () => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const getInitialCart = (): CartItem[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem('yakro-fe-cart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn('Error reading localStorage cart', error);
        return [];
    }
};

const COMMISSION_RATE = 0.15; // 15% commission

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
  const [promoCode, setPromoCode] = React.useState<PromoApplication | null>(null);
  const { getRestaurant } = useData();
  const { user, userProfile } = useAuth();
  const { db } = useFirebase();

  React.useEffect(() => {
    try {
        window.localStorage.setItem('yakro-fe-cart', JSON.stringify(cartItems));
    } catch (error) {
        console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'image'>) => {
    if (cartItems.length > 0 && cartItems[0].restaurantId !== item.restaurantId) {
        if(confirm("Votre panier contient déjà des plats d'un autre restaurant. Voulez-vous le vider pour commander ici ?")) {
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
  };

  const getUniqueKey = (itemId: string, side?: string, drink?: string) => {
    return `${itemId}-${side || 'none'}-${drink || 'none'}`;
  }

  const removeFromCart = (itemId: string, side?: string, drink?: string) => {
    const keyToRemove = getUniqueKey(itemId, side, drink);
    setCartItems(prevItems => prevItems.filter(i => 
        getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) !== keyToRemove
    ));
  };

  const updateQuantity = (itemId: string, quantity: number, side?: string, drink?: string) => {
    const keyToUpdate = getUniqueKey(itemId, side, drink);
    if (quantity <= 0) {
      removeFromCart(itemId, side, drink);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => (getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) === keyToUpdate ? { ...i, quantite: quantity } : i))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode(null);
  };

  const reorderItems = (items: Omit<CartItem, 'image'>[]) => {
    if (items.length === 0) return;
    const merged: CartItem[] = [];
    const keyOf = (i: Omit<CartItem, 'image'>) =>
      `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}`;
    for (const item of items) {
      const key = keyOf(item);
      const existing = merged.find(m => keyOf(m) === key);
      if (existing) {
        existing.quantite += item.quantite;
      } else {
        merged.push({ ...item });
      }
    }
    setCartItems(merged);
  };

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

  // Recalcule le promo si sous-total/livraison changent (peut invalider le minimum)
  React.useEffect(() => {
    if (!promoCode) return;
    const result = applyPromoCode(promoCode.code.code, cartSubtotal, cartDeliveryFee);
    if (!result.ok) {
      setPromoCode(null);
    } else {
      setPromoCode(result.application);
    }
  }, [cartSubtotal, cartDeliveryFee]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartDiscount = React.useMemo(() => {
    if (!promoCode) return 0;
    return promoCode.reduction + (promoCode.fraisLivraisonOffert ? cartDeliveryFee : 0);
  }, [promoCode, cartDeliveryFee]);

  const cartTotal = React.useMemo(() => {
    return Math.max(0, cartSubtotal + cartDeliveryFee - cartDiscount);
  }, [cartSubtotal, cartDeliveryFee, cartDiscount]);

  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantite, 0);
  }, [cartItems]);

  const applyPromo = (code: string) => {
    const result = applyPromoCode(code, cartSubtotal, cartDeliveryFee);
    if (!result.ok) return { ok: false as const, error: result.error };
    setPromoCode(result.application);
    return { ok: true as const };
  };

  const removePromo = () => setPromoCode(null);

  const placeOrder = async () => {
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
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);
    
    const commissionAmount = cartSubtotal * COMMISSION_RATE;
    const netRevenue = cartSubtotal - commissionAmount;
    const discount = cartDiscount;
    
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
        fraisDeLivraison: promoCode?.fraisLivraisonOffert ? 0 : cartDeliveryFee,
        total: cartTotal,
        tauxCommission: COMMISSION_RATE,
        montantCommission: commissionAmount,
        revenuNet: netRevenue,
        ...(promoCode && {
            codePromo: promoCode.code.code,
            reductionPromo: discount,
        }),
        date: new Date().toISOString(),
        nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
        restaurantId: restaurantId,
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
    
    setDoc(orderDocRef, newOrder)
      .then(() => {
        clearCart();
        window.dispatchEvent(new CustomEvent('place-order'));
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: orderDocRef.path,
          operation: 'create',
          requestResourceData: newOrder,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, reorderItems, removeFromCart, updateQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartDiscount, cartTotal, cartCount, placeOrder, promoCode, applyPromo, removePromo }}>
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
