
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, where, Unsubscribe, DocumentData, Query, or, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

// Import server actions
import { addRestaurantAction, updateRestaurant } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';


interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  allUsers: UserProfile[];
  isLoading: boolean;
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => Promise<void>;
  updateRestaurant: (restaurantId: string, data: Partial<Restaurant>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile: File | null) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>, imageFile: File | null) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['statut'], delivererId?: string) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  allUsers: [],
  isLoading: true,

  addRestaurant: async (restaurant) => {
    await addRestaurantAction(restaurant);
  },

  updateRestaurant: async (restaurantId, data) => {
    await updateRestaurant(restaurantId, data);
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

  fetchAllUsers: async () => {
      try {
        const usersCollection = collection(db, 'utilisateurs');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        set({ allUsers: usersList });
      } catch (error) {
        console.error("Error fetching all users:", error);
        set({ allUsers: [] });
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
    const fetchAllUsers = useDataStore((state) => state.fetchAllUsers);
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const collectionsToFetch = ['restaurants', 'plats'];
        const unsubscribes: Unsubscribe[] = [];

        collectionsToFetch.forEach(collectionName => {
            const q = collection(db, collectionName);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (collectionName === 'restaurants') {
                    useDataStore.setState({ restaurants: list as Restaurant[] });
                } else if (collectionName === 'plats') {
                    useDataStore.setState({ menuItems: list as MenuItem[] });
                }
            }, (error) => {
                console.error(`Error on ${collectionName} snapshot listener:`, error);
            });
            unsubscribes.push(unsubscribe);
        });

        // Combined loading state check
        const checkLoading = () => {
            const state = useDataStore.getState();
            if (state.restaurants.length > 0 && state.menuItems.length > 0) {
                 // The loading state will be properly handled by the orders subscription
            }
        };
        checkLoading();


        return () => unsubscribes.forEach(unsub => unsub());
    }, []);
    

    // Subscribe to Orders (dependent on user and role)
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        const myRestaurantIds = useDataStore.getState().restaurants
          .filter(r => r.proprietaireId === user?.uid)
          .map(r => r.id);

        if (user) {
            const ordersCollection = collection(db, 'commandes');
            let q: Query<DocumentData> | null = null;

            if (activeRole === 'client') {
                q = query(ordersCollection, where("userId", "==", user.uid));
            } else if (activeRole === 'restaurateur') {
                if (myRestaurantIds.length > 0) {
                    q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (activeRole === 'livreur') {
                q = query(ordersCollection, or(
                    where("statut", "==", "En Préparation"),
                    where("livreurId", "==", user.uid)
                ));
            } else if (userProfile?.roleSysteme === 'SuperAdmin') {
                q = ordersCollection; // SuperAdmin sees all orders
            }
            
            if (q) {
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                    const sortedOrders = ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    useDataStore.setState({ orders: sortedOrders, isLoading: false });
                }, (error) => {
                    console.error("Error on orders snapshot listener:", error);
                    useDataStore.setState({ isLoading: false });
                });
            } else {
                 useDataStore.setState({ orders: [], isLoading: false });
            }
        } else {
            useDataStore.setState({ orders: [], isLoading: false });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, activeRole, userProfile?.roleSysteme, useDataStore.getState().restaurants]);


    // Fetch all users for SuperAdmin
    React.useEffect(() => {
        if (userProfile?.roleSysteme === 'SuperAdmin') {
            fetchAllUsers();
        } else {
             useDataStore.setState({ allUsers: [] });
        }
    }, [userProfile?.roleSysteme, fetchAllUsers]);

  return <>{children}</>;
};


// Custom hook to use in components
export const useData = () => {
    const store = useDataStore();
    return store;
};
