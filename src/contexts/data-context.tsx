

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

function setupSubscription<T extends DocumentData>(
  param: string | Query<DocumentData, DocumentData>,
  setData: (data: T[]) => void
): Unsubscribe {
  const q = typeof param === 'string' ? query(collection(db, param)) : param;
  const collectionId = typeof param === 'string' ? param : (q as any)._query?.path?.segments?.[0] || 'unknown';

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      setData(list);
    },
    (error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({ path: collectionId, operation: 'list' })
      );
      console.error(`Error fetching ${collectionId}:`, error);
    }
  );
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile, activeRole } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setIsLoading } = useDataStore();
    
    React.useEffect(() => {
        setIsLoading(true);

        const restaurantUnsub = onSnapshot(collection(db, 'restaurants'), async (snapshot) => {
            if (snapshot.empty && user?.uid) {
                 await seedDatabaseAction(user.uid);
            } else {
                const restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Restaurant[];
                setRestaurants(restaurants);
            }
        }, (error) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'restaurants', operation: 'list'}));
             console.error(`Error fetching restaurants:`, error);
        });

        const menuItemsUnsub = setupSubscription<MenuItem>('plats', setMenuItems);
        
        let ordersUnsub: Unsubscribe | undefined;
        
        if (user && userProfile) {
            const ordersCollectionRef = collection(db, "commandes");
            let q: Query | null = null;
            
            if (userProfile.roleSysteme === 'SuperAdmin') {
                q = query(ordersCollectionRef);
            } else if (activeRole === 'client') {
                q = query(ordersCollectionRef, where("userId", "==", user.uid));
            } else if (activeRole === 'livreur') {
                q = query(ordersCollectionRef, where("statut", "==", "En Préparation"));
            } else if (activeRole === 'restaurateur') {
                const myRestaurantIds = useDataStore.getState().restaurants
                    .filter(r => r.proprietaireId === user.uid)
                    .map(r => r.id);
                if (myRestaurantIds.length > 0) {
                    q = query(ordersCollectionRef, where("restaurantId", "in", myRestaurantIds));
                } else {
                    // Restaurateur has no restaurants, don't query for orders.
                    setOrders([]);
                }
            }

            if (q) {
                ordersUnsub = setupSubscription<Order>(q, (initialOrders) => {
                    if (activeRole === 'livreur') {
                        const enRouteQuery = query(ordersCollectionRef, where("livreurId", "==", user.uid), where("statut", "==", "En Route"));
                        getDocs(enRouteQuery).then(enRouteSnap => {
                            const enRouteOrders = enRouteSnap.docs.map(d => ({id: d.id, ...d.data()}) as Order);
                            const combinedOrders = [...initialOrders, ...enRouteOrders];
                            const uniqueOrders = Array.from(new Set(combinedOrders.map(o => o.id))).map(id => combinedOrders.find(o => o.id === id)!);
                            setOrders(uniqueOrders);
                        });
                    } else {
                        setOrders(initialOrders);
                    }
                });
            } else if (activeRole !== 'restaurateur') {
                 // For roles that might not have a query (e.g. invalid role), clear orders
                 setOrders([]);
            }

        } else {
            // User is not logged in, or profile is not loaded yet.
            setOrders([]);
        }

        const timer = setTimeout(() => setIsLoading(false), 1500);

        return () => {
            clearTimeout(timer);
            restaurantUnsub();
            menuItemsUnsub();
            if (ordersUnsub) {
                ordersUnsub();
            }
        };
    }, [user, userProfile, activeRole, setIsLoading, setRestaurants, setMenuItems, setOrders]);

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
