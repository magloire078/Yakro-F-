

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
  addRestaurant: (data: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette' >, imageFile: File | null) => Promise<void>;
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
    try {
        await addRestaurantAction(formData);
    } catch(e: any) {
        // This is a generic catch, but we can wrap it for the UI
         const permissionError = new FirestorePermissionError({
            path: 'restaurants/[new_id]',
            operation: 'create',
            requestResourceData: restaurantData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e; // Re-throw to let the caller know it failed
    }
  },

  updateRestaurant: async (restaurantId, data, imageFile) => {
    const formData = new FormData();
    formData.append('restaurantId', restaurantId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    try {
        await updateRestaurantAction(formData);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: `restaurants/${restaurantId}`,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },

  addMenuItem: async (item, imageFile) => {
    const formData = new FormData();
    formData.append('item', JSON.stringify(item));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    try {
        await addMenuItemAction(formData);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: 'plats/[new_id]',
            operation: 'create',
            requestResourceData: item,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },
  
  updateMenuItem: async (itemId, data, imageFile) => {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    try {
        await updateMenuItemAction(formData);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: `plats/${itemId}`,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },

  deleteMenuItem: async (itemId) => {
     try {
        await deleteMenuItemAction(itemId);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: `plats/${itemId}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },

  addOrder: async (order) => {
    try {
        await addOrderAction(order);
    } catch(e: any) {
        const permissionError = new FirestorePermissionError({
            path: 'commandes/[new_id]',
            operation: 'create',
            requestResourceData: order,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },

  updateOrderStatus: async (orderId, status, delivererId) => {
    try {
        await updateOrderStatusAction({ orderId, status, delivererId });
    } catch (e:any) {
        const permissionError = new FirestorePermissionError({
            path: `commandes/${orderId}`,
            operation: 'update',
            requestResourceData: {statut: status, livreurId: delivererId}
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
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
        let subscriptions: Unsubscribe[] = [];

        const setupSubscription = (
            q: Query,
            collectionName: string,
            onData: (data: DocumentData[]) => void
        ) => {
            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    onData(list);
                },
                (error) => {
                    const permissionError = new FirestorePermissionError({
                        path: collectionName,
                        operation: 'list'
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    console.error(`Permission error on ${collectionName}:`, error);
                }
            );
            subscriptions.push(unsubscribe);
        };

        // Abonnements aux données publiques
        setupSubscription(
            query(collection(db, 'restaurants')),
            'restaurants',
            (data) => useDataStore.setState({ restaurants: data as Restaurant[] })
        );

        setupSubscription(
            query(collection(db, 'plats')),
            'plats',
            (data) => useDataStore.setState({ menuItems: data as MenuItem[] })
        );

        // Abonnement aux données privées (commandes)
        if (user && userProfile) {
            let ordersQuery: Query | null = null;
            
            const myRestaurantIds = userProfile.roleSysteme === 'SuperAdmin' 
                ? [] // SuperAdmin will get all orders
                : useDataStore.getState().restaurants
                    .filter(r => r.proprietaireId === user.uid)
                    .map(r => r.id);

            if (userProfile.roleSysteme === 'SuperAdmin') {
                ordersQuery = query(collection(db, 'commandes'));
            } else if (activeRole === 'client') {
                 ordersQuery = query(collection(db, "commandes"), where("userId", "==", user.uid));
            } else if (activeRole === 'livreur') {
                ordersQuery = query(collection(db, "commandes"), or(
                    where('livreurId', '==', user.uid),
                    where('statut', '==', 'En Préparation')
                ));
            } else if (activeRole === 'restaurateur') {
                if (myRestaurantIds.length > 0) {
                    ordersQuery = query(collection(db, 'commandes'), where('restaurantId', 'in', myRestaurantIds));
                }
            } 

            if (ordersQuery) {
                setupSubscription(
                    ordersQuery,
                    'commandes',
                    (data) => useDataStore.setState({ orders: data as Order[] })
                );
            } else if (activeRole === 'restaurateur' && myRestaurantIds.length === 0) {
                useDataStore.setState({ orders: [] }); // No restaurants, so no orders
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
    }, [user, userProfile, activeRole]);

    return <>{children}</>;
};


export const useData = () => {
  const { user } = useAuth();
  const state = useDataStore();

  const addRestaurant = async (
    restaurantData: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette' | 'proprietaireId'>, 
    imageFile: File | null
  ) => {
    if (!user) throw new Error("User not authenticated");

    const dataWithOwner = { ...restaurantData, proprietaireId: user.uid };
    
    await state.addRestaurant(dataWithOwner, imageFile);
  };
  
  return { ...state, addRestaurant };
};
