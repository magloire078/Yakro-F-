

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
    const { user, activeRole, userProfile } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const unsubscribes: Unsubscribe[] = [];
        
        const setupSubscription = (q: Query<DocumentData, DocumentData>, callback: (docs: DocumentData[]) => void) => {
            const path = (q as any)._query.path.segments.join('/');
            const unsubscribe = onSnapshot(q, 
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(list);
                }, 
                (serverError) => {
                    const permissionError = new FirestorePermissionError({ path, operation: 'list'});
                    errorEmitter.emit('permission-error', permissionError);
                }
            );
            return unsubscribe;
        };

        const restaurantsQuery = query(collection(db, 'restaurants'));
        const unsubRestaurants = setupSubscription(restaurantsQuery, (data) => useDataStore.setState({ restaurants: data as Restaurant[] }));
        unsubscribes.push(unsubRestaurants);

        const menuItemsQuery = query(collection(db, 'plats'));
        const unsubMenuItems = setupSubscription(menuItemsQuery, (data) => useDataStore.setState({ menuItems: data as MenuItem[] }));
        unsubscribes.push(unsubMenuItems);
        
        // Mark loading as false after setting up initial subscriptions for public data
        useDataStore.setState({ isLoading: false });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, []);

    // Separate useEffect for user-dependent data like orders
    React.useEffect(() => {
        let unsubOrders: Unsubscribe | null = null;
        
        const setupSubscription = (q: Query<DocumentData, DocumentData>, callback: (docs: DocumentData[]) => void) => {
            const path = (q as any)._query.path.segments.join('/');
            const unsubscribe = onSnapshot(q, 
                (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(list);
                }, 
                (serverError) => {
                    const permissionError = new FirestorePermissionError({ path, operation: 'list'});
                    errorEmitter.emit('permission-error', permissionError);
                }
            );
            return unsubscribe;
        };
        
        if (user && userProfile) { // Ensure userProfile is loaded
            let ordersQuery: Query<DocumentData, DocumentData> | null = null;
            
            if (activeRole === 'client') {
                ordersQuery = query(collection(db, "commandes"), where("userId", "==", user.uid));
            } else if (activeRole === 'livreur') {
                ordersQuery = query(collection(db, "commandes"), or(
                    where('livreurId', '==', user.uid),
                    where('statut', '==', 'En Préparation')
                ));
            } else if (activeRole === 'restaurateur') {
                // Get restaurants from the store, which should be populated by now.
                const allRestaurants = useDataStore.getState().restaurants;
                const myRestaurantIds = allRestaurants
                    .filter(r => r.proprietaireId === user.uid)
                    .map(r => r.id);
                
                if (myRestaurantIds.length > 0) {
                    ordersQuery = query(collection(db, 'commandes'), where('restaurantId', 'in', myRestaurantIds));
                } else {
                    useDataStore.setState({ orders: [] }); // No restaurants, no orders.
                }
            } else if (userProfile.roleSysteme === 'SuperAdmin') {
                // SuperAdmins can see all orders
                ordersQuery = query(collection(db, 'commandes'));
            }

            if (ordersQuery) {
                unsubOrders = setupSubscription(ordersQuery, (data) => useDataStore.setState({ orders: data as Order[] }));
            }
        } else {
            // Not logged in, clear orders
            useDataStore.setState({ orders: [] });
        }

        return () => {
            if (unsubOrders) unsubOrders();
        };
    }, [user, userProfile, activeRole]); // Dependency on userProfile ensures it runs after profile is loaded

    return <>{children}</>;
};


export const useData = () => {
  return useDataStore();
};
