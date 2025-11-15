
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// Import server actions
import { addRestaurantAction, updateRestaurantAction } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';


interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  setOrders: (orders: Order[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addRestaurant: (data: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'>, imageFile: File | null) => Promise<void>;
  updateRestaurant: (restaurantId: string, data: Partial<Restaurant>, imageFile: File | null) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile: File | null) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>, imageFile: File | null) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['statut'], delivererId?: string) => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isLoading: true,
  setRestaurants: (restaurants) => set({ restaurants }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setOrders: (orders) => set({ orders }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addRestaurant: async (restaurantData, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(restaurantData));

    if (imageFile) {
        formData.append('image', imageFile);
    }
    await addRestaurantAction(formData);
  },

  updateRestaurant: async (restaurantId, data, imageFile) => {
    const formData = new FormData();
    formData.append('restaurantId', restaurantId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await updateRestaurantAction(formData);
  },

  addMenuItem: async (item, imageFile) => {
    const formData = new FormData();
    formData.append('item', JSON.stringify(item));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    await addMenuItemAction(formData);
  },
  
  updateMenuItem: async (itemId, data, imageFile) => {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await updateMenuItemAction(formData);
  },

  deleteMenuItem: async (itemId) => {
     await deleteMenuItemAction(itemId);
  },

  addOrder: async (order) => {
    await addOrderAction(order);
  },

  updateOrderStatus: async (orderId, status, delivererId) => {
    await updateOrderStatusAction({ orderId, status, delivererId });
  },

  getMenuItem: (id: string) => {
    return get().menuItems.find(i => i.id === id);
  },
  getRestaurant: (id: string) => {
    return get().restaurants.find(r => r.id === id);
  },
}));


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setIsLoading } = useDataStore();
    
    React.useEffect(() => {
        setIsLoading(true);
        
        const setupSubscription = <T extends DocumentData>(collectionName: string, setData: (data: T[]) => void): Unsubscribe => {
            const q = query(collection(db, collectionName));
            return onSnapshot(q, 
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
                    setData(list);
                    setIsLoading(false); // Set loading to false after data is fetched
                }, 
                (error) => {
                    console.error(`Error fetching ${collectionName}:`, error);
                    const permissionError = new FirestorePermissionError({
                        path: collectionName,
                        operation: 'list'
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setIsLoading(false); // Also stop loading on error
                }
            );
        };

        const restaurantUnsub = setupSubscription<Restaurant>('restaurants', setRestaurants);
        const menuItemsUnsub = setupSubscription<MenuItem>('plats', setMenuItems);
        const ordersUnsub = setupSubscription<Order>('commandes', setOrders);

        // Cleanup subscriptions on component unmount
        return () => {
            restaurantUnsub();
            menuItemsUnsub();
            ordersUnsub();
        };
    }, [setRestaurants, setMenuItems, setOrders, setIsLoading]);

    return <>{children}</>;
};


export const useData = () => {
  const { user } = useAuth();
  const state = useDataStore();

  const addRestaurant = async (
    restaurantData: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'>, 
    imageFile: File | null
  ) => {
    if (!user) throw new Error("User not authenticated");
    
    await state.addRestaurant({ ...restaurantData, proprietaireId: user.uid }, imageFile);
  };
  
  return { ...state, addRestaurant };
};
