

'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order, MenuOption } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
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
        const item = window.localStorage.getItem('yakro-go-cart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn('Error reading localStorage cart', error);
        return [];
    }
};

const COMMISSION_RATE = 0.15; // 15% commission


export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(getInitialCart);
  const { addOrder, getRestaurant } = useData();
  const { user, userProfile } = useAuth();


  React.useEffect(() => {
    try {
        window.localStorage.setItem('yakro-go-cart', JSON.stringify(cartItems));
    } catch (error) {
        console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);


  const addToCart = (item: CartItem) => {
    // If cart is not empty and new item is from a different restaurant, clear the cart.
    if (cartItems.length > 0 && cartItems[0].restaurantId !== item.restaurantId) {
        setCartItems([{ ...item, quantity: 1 }]);
        return;
    }

    setCartItems(prevItems => {
      // Create a unique key for an item based on its ID and selected options
      const uniqueItemKey = `${item.id}-${item.selectedSide?.name || 'none'}-${item.selectedDrink?.name || 'none'}`;
      
      const existingItem = prevItems.find(i => 
        `${i.id}-${i.selectedSide?.name || 'none'}-${i.selectedDrink?.name || 'none'}` === uniqueItemKey
      );

      if (existingItem) {
        return prevItems.map(i =>
          `${i.id}-${i.selectedSide?.name || 'none'}-${i.selectedDrink?.name || 'none'}` === uniqueItemKey 
          ? { ...i, quantity: i.quantity + item.quantity } 
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
        getUniqueKey(i.id, i.selectedSide?.name, i.selectedDrink?.name) !== keyToRemove
    ));
  };

  const updateQuantity = (itemId: string, quantity: number, side?: string, drink?: string) => {
    const keyToUpdate = getUniqueKey(itemId, side, drink);
    if (quantity <= 0) {
      removeFromCart(itemId, side, drink);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => (getUniqueKey(i.id, i.selectedSide?.name, i.selectedDrink?.name) === keyToUpdate ? { ...i, quantity } : i))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartSubtotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price;
      const sidePrice = item.selectedSide?.price || 0;
      const drinkPrice = item.selectedDrink?.price || 0;
      return total + (itemPrice + sidePrice + drinkPrice) * item.quantity;
    }, 0);
  }, [cartItems]);

  const cartDeliveryFee = React.useMemo(() => {
      if (cartItems.length === 0) return 0;
      const restaurantId = cartItems[0].restaurantId;
      const restaurant = getRestaurant(restaurantId);
      return restaurant?.deliveryFee || 0;
  }, [cartItems, getRestaurant]);

  const cartTotal = React.useMemo(() => {
    return cartSubtotal + cartDeliveryFee;
  }, [cartSubtotal, cartDeliveryFee]);
  
  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const placeOrder = async () => {
    if (!user || !userProfile || cartItems.length === 0) {
        console.error("User not logged in or cart is empty");
        throw new Error("User not logged in or cart is empty");
    }
    
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);
    
    // Commission is calculated on the subtotal (food items only), not on the delivery fee.
    const commissionAmount = cartSubtotal * COMMISSION_RATE;
    const netRevenue = cartSubtotal - commissionAmount;

    const newOrder: Omit<Order, 'id'> = {
        userId: user.uid,
        items: cartItems,
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
        total: cartTotal,
        commissionRate: COMMISSION_RATE,
        commissionAmount: commissionAmount,
        netRevenue: netRevenue,
        date: new Date().toISOString(),
        restaurantName: restaurant?.name || 'Restaurant inconnu',
        restaurantId: restaurantId,
        status: 'Placée',
        customerAddress: userProfile.defaultAddress || 'Adresse non spécifiée',
        restaurantAddress: restaurant?.address || 'Adresse du restaurant non spécifiée',
        customerPhone: userProfile.phone || 'Numéro non spécifié',
    };

    await addOrder(newOrder);
    clearCart();
    window.dispatchEvent(new CustomEvent('place-order'));
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
