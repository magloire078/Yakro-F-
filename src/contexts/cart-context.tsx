'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order, MenuOption } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'image'>) => void;
  removeFromCart: (itemId: string, side?: string, drink?: string) => void;
  updateQuantity: (itemId: string, quantity: number, side?: string, drink?: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  cartCount: number;
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
        setCartItems([{ ...item, quantite: 1 }]);
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

  const cartTotal = React.useMemo(() => {
    return cartSubtotal + cartDeliveryFee;
  }, [cartSubtotal, cartDeliveryFee]);
  
  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantite, 0);
  }, [cartItems]);

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
    if (!location) {
        const confirmNoLocation = window.confirm("Impossible de récupérer votre position GPS. Voulez-vous continuer sans localisation ? Cela pourrait compliquer la livraison.");
        if (!confirmNoLocation) {
            throw new Error("Commande annulée. La localisation GPS est recommandée.");
        }
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
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartTotal, cartCount, placeOrder }}>
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