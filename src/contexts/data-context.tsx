
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
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    try {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('data', JSON.stringify(data));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        await updateRestaurantAction(formData);
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: restaurantDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
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
    const { user, userProfile, activeRole } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const unsubscribes: Unsubscribe[] = [];

        const restaurantsUnsub = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Restaurant, 'id'> })) as Restaurant[];
            useDataStore.setState({ restaurants: list });
        }, (error) => {
            console.error("Error fetching restaurants:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'restaurants', operation: 'list'}));
        });
        unsubscribes.push(restaurantsUnsub);
        
        const menuItemsUnsub = onSnapshot(collection(db, 'plats'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<MenuItem, 'id'> })) as MenuItem[];
            useDataStore.setState({ menuItems: list });
        }, (error) => {
             console.error("Error fetching menu items:", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'plats', operation: 'list'}));
        });
        unsubscribes.push(menuItemsUnsub);
        
        let ordersQuery: Query<DocumentData> | null = null;
        
        if (user) {
            ordersQuery = query(collection(db, 'commandes'));
        }

        if (ordersQuery) {
            const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Order, 'id'> })) as Order[];
                useDataStore.setState({ orders: list, isLoading: false });
            }, (error) => {
                console.error("Error fetching orders:", error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'commandes', operation: 'list'}));
                useDataStore.setState({ isLoading: false });
            });
            unsubscribes.push(ordersUnsub);
        } else {
             useDataStore.setState({ orders: [], isLoading: false });
        }
        
        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [user, userProfile, activeRole]);

    return <>{children}</>;
};


export const useData = () => {
  return useDataStore();
};
