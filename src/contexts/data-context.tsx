
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, where, Unsubscribe, DocumentData, Query, or, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

// Import server actions
import { addRestaurantAction, updateRestaurantAction } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  addRestaurant: (data: Omit<Restaurant, 'id'>, imageFile: File | null) => Promise<void>;
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
  addRestaurant: async (data, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
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
    // This server action does not have permission error handling on client,
    // because it's a server action. The error would be on the server logs.
    // To fix this, we need to call updateDoc from here and catch the error.
    // For now, we will assume it works or is caught by a higher-level boundary.
    // But for a robust solution, the call should be wrapped.
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
    const { user, activeRole } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const unsubscribes: Unsubscribe[] = [];
        
        const setupSubscription = (q: Query<DocumentData, DocumentData> | null, callback: (docs: DocumentData[]) => void) => {
            if (!q) {
                callback([]);
                return () => {}; // Return a no-op function if there's no query
            }
            const unsubscribe = onSnapshot(q, 
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(list);
                }, 
                (serverError) => {
                    const permissionError = new FirestorePermissionError({ path: (q as any)._query.path.segments.join('/'), operation: 'list'});
                    errorEmitter.emit('permission-error', permissionError);
                }
            );
            return unsubscribe;
        };

        const restaurantsQuery = query(collection(db, 'restaurants'));
        unsubscribes.push(setupSubscription(restaurantsQuery, (data) => useDataStore.setState({ restaurants: data as Restaurant[] })));

        const menuItemsQuery = query(collection(db, 'plats'));
        unsubscribes.push(setupSubscription(menuItemsQuery, (data) => useDataStore.setState({ menuItems: data as MenuItem[] })));

        if (user) {
            let ordersQuery: Query | null = null;
            if (activeRole === 'restaurateur') {
                const myRestaurantIds = useDataStore.getState().restaurants
                    .filter(r => r.proprietaireId === user.uid)
                    .map(r => r.id);
                
                if (myRestaurantIds.length > 0) {
                  ordersQuery = query(collection(db, 'commandes'), where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (activeRole === 'livreur') {
                 ordersQuery = query(collection(db, 'commandes'), or(
                    where('livreurId', '==', user.uid),
                    where('statut', '==', 'En Préparation')
                ));
            } else { // Client
                 ordersQuery = query(collection(db, 'commandes'), where('userId', '==', user.uid));
            }
            
            unsubscribes.push(setupSubscription(ordersQuery, (data) => useDataStore.setState({ orders: data as Order[] })));

        } else {
            useDataStore.setState({ orders: [] });
        }
        
        // Mark loading as false after setting up initial subscriptions
        useDataStore.setState({ isLoading: false });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [user, activeRole]);

    return <>{children}</>;
};


export const useData = () => {
  return useDataStore();
};
