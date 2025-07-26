
'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
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
        const item = window.localStorage.getItem('yakro-fe-cart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn('Error reading localStorage cart', error);
        return [];
    }
};


export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(getInitialCart);
  const { addOrder, getRestaurant } = useData();
  const { user } = useAuth();


  React.useEffect(() => {
    try {
        window.localStorage.setItem('yakro-fe-cart', JSON.stringify(cartItems));
    } catch (error) {
        console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);


  const addToCart = (item: MenuItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(i => i.id !== itemId));
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
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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

    const newOrder: Omit<Order, 'id'> = {
        userId: user.uid,
        items: cartItems,
        total: cartTotal,
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

    // This is a simulation. In a real app, this would trigger the checkout flow.
    // We fire a custom event that the main page can listen to.
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
