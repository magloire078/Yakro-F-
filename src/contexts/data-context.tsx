
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, where, Unsubscribe, DocumentData, Query, or, getDocs, doc } from 'firebase/firestore';
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
    const { user, userProfile } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });
        let subscriptions: Unsubscribe[] = [];

        const setupSubscription = (
            q: Query,
            onData: (data: DocumentData[]) => void
        ) => {
            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    onData(list);
                },
                (error) => {
                    const permissionError = new FirestorePermissionError({
                        path: (q as any)._query.path.segments.join('/'),
                        operation: 'list'
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
            );
            subscriptions.push(unsubscribe);
        };

        // Public data subscriptions
        setupSubscription(
            query(collection(db, 'restaurants')),
            (data) => useDataStore.setState({ restaurants: data as Restaurant[] })
        );

        setupSubscription(
            query(collection(db, 'plats')),
            (data) => useDataStore.setState({ menuItems: data as MenuItem[] })
        );
        
        // Conditional subscription for orders based on user role
        if (user && userProfile) {
            // A SuperAdmin, Restaurateur, or Livreur might need a broader view of orders.
            // Security rules will ultimately enforce what they can see.
            // Client users will only see their own orders.
            // This simplified query relies on security rules to filter the data.
            const ordersQuery = query(collection(db, 'commandes'));
             if(ordersQuery) {
                setupSubscription(
                    ordersQuery,
                    (data) => useDataStore.setState({ orders: data as Order[] })
                );
            }
        } else {
             useDataStore.setState({ orders: [] });
        }


        const loadingTimeout = setTimeout(() => {
             useDataStore.setState({ isLoading: false });
        }, 2000);
       

        return () => {
            clearTimeout(loadingTimeout);
            subscriptions.forEach(unsub => unsub());
        };
    }, [user, userProfile]);

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
    
    // The proprietaireId is added in the server action from the authenticated user
    await state.addRestaurant({ ...restaurantData, proprietaireId: user.uid }, imageFile);
  };
  
  return { ...state, addRestaurant };
};
