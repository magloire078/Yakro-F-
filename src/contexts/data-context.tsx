
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, where, Unsubscribe, DocumentData, Query, or, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

// Import server actions
import { addRestaurantAction, updateRestaurantAction } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { doc } from 'firebase/firestore';


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
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const restaurantsCollectionRef = collection(db, 'restaurants');
        const restaurantsUnsub = onSnapshot(restaurantsCollectionRef, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Restaurant, 'id'> })) as Restaurant[];
            useDataStore.setState({ restaurants: list });
        }, (serverError) => {
             const permissionError = new FirestorePermissionError({ path: restaurantsCollectionRef.path, operation: 'list' });
             errorEmitter.emit('permission-error', permissionError);
        });
        
        const menuItemsCollectionRef = collection(db, 'plats');
        const menuItemsUnsub = onSnapshot(menuItemsCollectionRef, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<MenuItem, 'id'> })) as MenuItem[];
            useDataStore.setState({ menuItems: list });
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({ path: menuItemsCollectionRef.path, operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
        });
        
        const ordersCollectionRef = collection(db, 'commandes');
        const ordersUnsub = onSnapshot(ordersCollectionRef, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Order, 'id'> })) as Order[];
            useDataStore.setState({ orders: list });
             useDataStore.setState({ isLoading: false });
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({ path: ordersCollectionRef.path, operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
            useDataStore.setState({ isLoading: false });
        });

        return () => {
            restaurantsUnsub();
            menuItemsUnsub();
            ordersUnsub();
        };
    }, []);

    return <>{children}</>;
};


export const useData = () => {
  return useDataStore();
};
