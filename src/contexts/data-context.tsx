

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
    const { user, activeRole, userProfile, loading: authLoading } = useAuth();
    
    // Effect for public, non-user-specific data
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const setupSubscription = (collectionName: 'restaurants' | 'plats', callback: (data: DocumentData[]) => void) => {
            const q = query(collection(db, collectionName));
            const unsubscribe = onSnapshot(q, 
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(list);
                },
                (serverError) => {
                    console.error(`Permission error on path: ${collectionName}`, serverError);
                    const permissionError = new FirestorePermissionError({ path: collectionName, operation: 'list' });
                    errorEmitter.emit('permission-error', permissionError);
                }
            );
            return unsubscribe;
        };
        
        const unsubRestaurants = setupSubscription('restaurants', (data) => useDataStore.setState({ restaurants: data as Restaurant[] }));
        const unsubMenuItems = setupSubscription('plats', (data) => useDataStore.setState({ menuItems: data as MenuItem[] }));
        
        // Loading will be set to false in the user-specific effect.

        return () => {
            unsubRestaurants();
            unsubMenuItems();
        };
    }, []);

    // Effect for user-specific data (orders)
    React.useEffect(() => {
        let unsubOrders: Unsubscribe | null = null;
        
        if (authLoading) {
            return; // Wait until authentication status is resolved
        }

        useDataStore.setState({ isLoading: true });

        if (user && userProfile) {
            let ordersQuery: Query<DocumentData, DocumentData> | null = null;
            
            if (activeRole === 'client') {
                ordersQuery = query(collection(db, "commandes"), where("userId", "==", user.uid));
            } else if (activeRole === 'livreur') {
                ordersQuery = query(collection(db, "commandes"), or(
                    where('livreurId', '==', user.uid),
                    where('statut', '==', 'En Préparation')
                ));
            } else if (activeRole === 'restaurateur') {
                const myRestaurantIds = useDataStore.getState().restaurants
                    .filter(r => r.proprietaireId === user.uid)
                    .map(r => r.id);
                
                if (myRestaurantIds.length > 0) {
                    ordersQuery = query(collection(db, 'commandes'), where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (userProfile.roleSysteme === 'SuperAdmin') {
                ordersQuery = query(collection(db, 'commandes'));
            }

            if (ordersQuery) {
                const path = (ordersQuery as any)._query.path.segments.join('/');
                unsubOrders = onSnapshot(ordersQuery,
                    (snapshot) => {
                        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
                        useDataStore.setState({ orders: ordersData });
                        useDataStore.setState({ isLoading: false }); // All data loaded
                    },
                    (serverError) => {
                        console.error(`Permission error on path: ${path}`, serverError);
                        const permissionError = new FirestorePermissionError({ path: 'commandes', operation: 'list' });
                        errorEmitter.emit('permission-error', permissionError);
                        useDataStore.setState({ isLoading: false }); // Stop loading on error
                    }
                );
            } else {
                 useDataStore.setState({ orders: [], isLoading: false }); // No query to run, stop loading.
            }
        } else {
            // Not logged in or profile not ready, clear orders and stop loading.
            useDataStore.setState({ orders: [], isLoading: false });
        }

        return () => {
            if (unsubOrders) {
                unsubOrders();
            }
        };
    }, [user, userProfile, activeRole, authLoading]);

    return <>{children}</>;
};


export const useData = () => {
  return useDataStore();
};
