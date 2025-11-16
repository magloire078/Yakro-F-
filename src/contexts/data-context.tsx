
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, getDocs, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// Import server actions
import { addRestaurantAction, updateRestaurantAction } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';
import { seedDatabaseAction } from '@/app/actions/seed-actions';


interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  setOrders: (orders: Order[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addRestaurant: (restaurantData: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'> & { proprietaireId: string }, imageFile: File | null) => Promise<void>;
  updateRestaurant: (restaurantId: string, data: Partial<Restaurant>, imageFile: File | null) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile: File | null) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>, imageFile: File | null) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['statut'], delivererId?: string) => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
  getOrder: (id: string) => Order | undefined;
}

export const useData = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isLoading: true,
  setRestaurants: (restaurants) => set({ restaurants }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setOrders: (orders) => set({ orders }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addRestaurant: async (fullRestaurantData, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(fullRestaurantData));
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
  getOrder: (id: string) => {
    return get().orders.find(o => o.id === id);
  }
}));

function setupSubscription<T extends DocumentData>(
  q: Query<DocumentData, DocumentData>,
  callback: (data: T[]) => void,
  onError: (error: any) => void
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      callback(list);
    },
    (error) => {
        onError(error);
    }
  );
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    const { restaurants, setRestaurants, setMenuItems, setOrders, setIsLoading } = useData();
    const [authReady, setAuthReady] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading) {
            setAuthReady(true);
        }
    }, [authLoading]);
    
    React.useEffect(() => {
        if (!authReady) {
            return;
        }

        setIsLoading(true);
        const collectionRef = (path: string) => collection(db, path);
        const getErrorHandler = (path: string) => (error: any) => {
            const permissionError = new FirestorePermissionError({ path, operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
            console.error(`Error subscribing to ${path}:`, error);
        };
        
        // Restaurants & MenuItems are public
        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, getErrorHandler('restaurants'));
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, getErrorHandler('plats'));
        let unsubOrders: Unsubscribe | null = null;
        
        // Orders require role-based queries.
        if (user && userProfile) {
            switch(activeRole) {
                case 'client': {
                    const q = query(collectionRef('commandes'), where("userId", "==", user.uid));
                    unsubOrders = setupSubscription<Order>(q, setOrders, getErrorHandler('commandes'));
                    break;
                }
                case 'restaurateur': {
                    // This logic is now dependent on `restaurants` which is updated in real-time
                    const myRestaurantIds = restaurants.filter(r => r.proprietaireId === user.uid).map(r => r.id);
                    if (myRestaurantIds.length > 0) {
                        const q = query(collectionRef('commandes'), where("restaurantId", "in", myRestaurantIds));
                        unsubOrders = setupSubscription<Order>(q, setOrders, getErrorHandler('commandes'));
                    } else {
                        setOrders([]);
                    }
                    break;
                }
                case 'livreur': {
                    let availableOrders: Order[] = [];
                    let assignedOrders: Order[] = [];

                    const mergeAndSetOrders = () => {
                        const combined = [...availableOrders, ...assignedOrders];
                        const uniqueOrders = Array.from(new Map(combined.map(o => [o.id, o])).values());
                        setOrders(uniqueOrders);
                    };

                    const q1 = query(collectionRef('commandes'), where("statut", "==", "En Préparation"));
                    const unsubAvailable = setupSubscription<Order>(q1, (data) => {
                        availableOrders = data;
                        mergeAndSetOrders();
                    }, getErrorHandler('commandes'));

                    const q2 = query(collectionRef('commandes'), where("livreurId", "==", user.uid), where("statut", "==", "En Route"));
                    const unsubAssigned = setupSubscription<Order>(q2, (data) => {
                        assignedOrders = data;
                        mergeAndSetOrders();
                    }, getErrorHandler('commandes'));
                    
                    unsubOrders = () => {
                        unsubAvailable();
                        unsubAssigned();
                    };
                    break;
                }
                default: {
                    if (userProfile.roleSysteme === 'SuperAdmin') {
                        unsubOrders = setupSubscription<Order>(query(collectionRef('commandes')), setOrders, getErrorHandler('commandes'));
                    } else {
                        setOrders([]);
                    }
                }
            }
        } else {
            setOrders([]);
        }


        const timer = setTimeout(() => setIsLoading(false), 1500);
        
        return () => {
            unsubRestaurants();
            unsubMenuItems();
            if (unsubOrders) unsubOrders();
            clearTimeout(timer);
        };
    }, [authReady, user, userProfile, activeRole, restaurants, setIsLoading, setRestaurants, setMenuItems, setOrders]);

    return <>{children}</>;
};
