

'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, getDocs, Query, doc } from 'firebase/firestore';
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
  addRestaurant: (data: Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette' | 'proprietaireId'>, imageFile: File | null) => Promise<void>;
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
    // This is handled by the useData hook now to get user context
    throw new Error("addRestaurant should not be called directly from the store.");
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
  param: string | Query<DocumentData, DocumentData>,
  setData: (data: T[]) => void,
  collectionIdOverride?: string
): Unsubscribe {
  const q = typeof param === 'string' ? query(collection(db, param)) : param;
  const collectionPath = (q as any)._query?.path?.segments?.join('/') || (typeof param === 'string' ? param : 'unknown_collection');

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      setData(list);
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
            path: collectionPath,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error(`Error fetching ${collectionPath}:`, error);
    }
  );
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setIsLoading } = useDataStore();
    const [authReady, setAuthReady] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading) {
            setAuthReady(true);
        }
    }, [authLoading]);
    
    React.useEffect(() => {
        if (!authReady) {
            return; // Don't run subscriptions until auth state is confirmed
        }

        setIsLoading(true);
        
        let unsubscribers: Unsubscribe[] = [];

        // Restaurants and Menu Items can be subscribed to by anyone
        unsubscribers.push(setupSubscription<Restaurant>('restaurants', async (restaurants) => {
            if (restaurants.length === 0 && user?.uid) {
                try {
                    await seedDatabaseAction(user.uid);
                } catch(e) {
                    // The error is already being handled by the action via the emitter
                }
            } else {
                setRestaurants(restaurants);
            }
        }));
        
        unsubscribers.push(setupSubscription<MenuItem>('plats', setMenuItems));
        
        // Orders subscription depends on the user's role
        if (user && userProfile) {
            const ordersCollectionRef = collection(db, "commandes");
            let q: Query | null = null;
            
            if (userProfile.roleSysteme === 'SuperAdmin') {
                q = query(ordersCollectionRef);
            } else if (activeRole === 'client' && user.uid) {
                q = query(ordersCollectionRef, where("userId", "==", user.uid));
            } else if (activeRole === 'livreur' && user.uid) {
                // Livreur sees orders ready for pickup and orders they are currently delivering
                const availableQuery = query(ordersCollectionRef, where("statut", "==", "En Préparation"));
                unsubscribers.push(setupSubscription<Order>(availableQuery, (availableOrders) => {
                    const assignedQuery = query(ordersCollectionRef, where("livreurId", "==", user.uid), where("statut", "==", "En Route"));
                    getDocs(assignedQuery).then(assignedSnap => {
                        const assignedOrders = assignedSnap.docs.map(d => ({id: d.id, ...d.data()}) as Order);
                        const combinedOrders = [...availableOrders, ...assignedOrders];
                        const uniqueOrders = Array.from(new Set(combinedOrders.map(o => o.id))).map(id => combinedOrders.find(o => o.id === id)!);
                        setOrders(uniqueOrders);
                    }).catch(err => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'commandes', operation: 'list'}));
                    });
                }, 'commandes'));
            } else if (activeRole === 'restaurateur' && user.uid) {
                // Must query restaurants first, then subscribe to orders
                const restoQuery = query(collection(db, 'restaurants'), where('proprietaireId', '==', user.uid));
                getDocs(restoQuery).then(restoSnap => {
                    const myRestaurantIds = restoSnap.docs.map(doc => doc.id);
                    if (myRestaurantIds.length > 0) {
                        const ordersQuery = query(ordersCollectionRef, where("restaurantId", "in", myRestaurantIds));
                        unsubscribers.push(setupSubscription<Order>(ordersQuery, setOrders, 'commandes'));
                    } else {
                        setOrders([]); // No restaurants, so no orders
                    }
                }).catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'restaurants', operation: 'list'}));
                });
            } else {
                 setOrders([]);
            }

            if (q) {
                unsubscribers.push(setupSubscription<Order>(q, setOrders, 'commandes'));
            }

        } else {
            // Not logged in, clear orders
            setOrders([]);
        }

        const timer = setTimeout(() => setIsLoading(false), 1500);
        unsubscribers.push(() => clearTimeout(timer));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [authReady, user, userProfile, activeRole, setIsLoading, setRestaurants, setMenuItems, setOrders]);

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
    
    const formData = new FormData();
    const fullData = { ...restaurantData, proprietaireId: user.uid };
    formData.append('data', JSON.stringify(fullData));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await addRestaurantAction(formData);
  };
  
  return { ...state, addRestaurant };
};
