

'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order, MenuOption } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
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
  const { user } = useAuth();


  React.useEffect(() => {
    try {
        window.localStorage.setItem('yakro-go-cart', JSON.stringify(cartItems));
    } catch (error) {
        console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);


  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      // For simplicity in this demo, we treat items with different options as distinct cart entries.
      // A more robust implementation might group them and allow editing options in the cart.
      const uniqueItemId = `${item.id}-${item.selectedSide?.name || ''}-${item.selectedDrink?.name || ''}`;
      
      const existingItem = prevItems.find(i => 
        `${i.id}-${i.selectedSide?.name || ''}-${i.selectedDrink?.name || ''}` === uniqueItemId
      );

      if (existingItem) {
        return prevItems.map(i =>
          `${i.id}-${i.selectedSide?.name || ''}-${i.selectedDrink?.name || ''}` === uniqueItemId 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(i => 
        // This is a simplified removal logic. It will remove all variants of an item.
        // A better implementation would pass a unique cart item ID.
        i.id !== itemId
    ));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => (i.id === itemId ? { ...i, quantity } : i))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price;
      const sidePrice = item.selectedSide?.price || 0;
      const drinkPrice = item.selectedDrink?.price || 0;
      return total + (itemPrice + sidePrice + drinkPrice) * item.quantity;
    }, 0);
  }, [cartItems]);
  
  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const placeOrder = async () => {
    if (!user || cartItems.length === 0) {
        // In a real app, you'd show an error message
        console.error("User not logged in or cart is empty");
        return;
    }
    
    // Assume all items in cart are from the same restaurant for this demo
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);

    const commissionAmount = cartTotal * COMMISSION_RATE;
    const netRevenue = cartTotal - commissionAmount;

    const newOrder: Omit<Order, 'id'> = {
        userId: user.uid,
        items: cartItems,
        total: cartTotal,
        commissionRate: COMMISSION_RATE,
        commissionAmount: commissionAmount,
        netRevenue: netRevenue,
        date: new Date().toISOString(),
        restaurantName: restaurant?.name || 'Restaurant inconnu',
        restaurantId: restaurantId,
        status: 'Placée', // Initial status
        // Add mock data for delivery details
        customerAddress: 'Angré 7ème Tranche, Villa 123',
        restaurantAddress: restaurant?.address || 'Rue des Jardins, Cocody',
        customerPhone: '07 01 02 03 04',
    };

    await addOrder(newOrder);
    clearCart();
    window.dispatchEvent(new CustomEvent('place-order'));
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, placeOrder }}>
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
