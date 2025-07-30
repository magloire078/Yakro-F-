
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { create } from 'zustand';
import { collection, addDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, Unsubscribe, DocumentData, Query, getDocs, deleteDoc, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isGenerating: boolean;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], delivererId?: string) => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isGenerating: false,
  isLoading: true,

  fetchData: async () => {
    if (!get().isLoading) return;
    try {
      await getDocs(collection(db, 'restaurants'));
    } catch (error) {
      console.error("Error connecting to Firestore: ", error);
    }
  },
  
  addRestaurant: async (restaurant) => {
    try {
      await addDoc(collection(db, "restaurants"), restaurant);
    } catch (e) {
      console.error("Error adding restaurant: ", e);
      throw e;
    }
  },

  addMenuItem: async (item) => {
    try {
      await addDoc(collection(db, "plats"), item);
    } catch (e) {
      console.error("Error adding menu item: ", e);
      throw e;
    }
  },
  
  updateMenuItem: async (itemId, data) => {
    const itemDocRef = doc(db, 'plats', itemId);
    try {
      await updateDoc(itemDocRef, data);
    } catch (e) {
      console.error("Error updating menu item: ", e);
      throw e;
    }
  },

  deleteMenuItem: async (itemId) => {
    const itemDocRef = doc(db, 'plats', itemId);
    try {
      await deleteDoc(itemDocRef);
    } catch (e) {
      console.error("Error deleting menu item: ", e);
      throw e;
    }
  },

  addOrder: async (order) => {
    try {
      await addDoc(collection(db, "commandes"), order);
    } catch (e) {
      console.error("Error adding order: ", e);
      throw e;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status'], delivererId?: string) => {
    const orderDocRef = doc(db, 'commandes', orderId);
    try {
        const updateData: {status: Order['status'], delivererId?: string} = { status };
        if (delivererId) {
            updateData.delivererId = delivererId;
        }
      await updateDoc(orderDocRef, updateData);
    } catch (e) {
      console.error("Error updating order status: ", e);
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
  const { fetchData } = useDataStore();
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeData();

  return <>{children}</>;
};

function useRealtimeData() {
    const { user, activeRole } = useAuth();

    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        let unsubRestaurants: Unsubscribe | null = null;
        const restaurantsCollection = collection(db, "restaurants");
        const myRestaurantIds = useDataStore.getState().restaurants.map(r => r.id);

        if (user && activeRole === 'restaurateur') {
            const q = query(restaurantsCollection, where("ownerId", "==", user.uid));
            unsubRestaurants = onSnapshot(q, (snapshot) => {
                const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
                useDataStore.setState({ restaurants: restaurantList, isLoading: false });
            }, (error) => {
                 console.error("Error on restaurateur's restaurants snapshot listener:", error);
                 useDataStore.setState({ isLoading: false });
            });
        } else {
            unsubRestaurants = onSnapshot(restaurantsCollection, (snapshot) => {
                const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
                useDataStore.setState({ restaurants: restaurantList, isLoading: false });
            }, (error) => {
                 console.error("Error on all restaurants snapshot listener:", error);
                 useDataStore.setState({ isLoading: false });
            });
        }
        
        const unsubMenuItems = onSnapshot(collection(db, "plats"), (snapshot) => {
            const menuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            useDataStore.setState({ menuItems: menuList });
        }, (error) => {
             console.error("Error on menuItems snapshot listener:", error);
        });

        let unsubOrders: Unsubscribe | null = null;
        if (user) {
            const ordersCollection = collection(db, 'commandes');
            let q: Query | null = null;

            switch (activeRole) {
                case 'client':
                    q = query(ordersCollection, where("userId", "==", user.uid));
                    break;
                case 'restaurateur':
                    if (myRestaurantIds.length > 0) {
                        q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                    }
                    break;
                case 'livreur':
                    q = query(ordersCollection, or(
                        where("status", "==", "En Préparation"),
                        where("delivererId", "==", user.uid)
                    ));
                    break;
            }

            if (q) {
                unsubOrders = onSnapshot(q, (snapshot) => {
                    const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                    const sortedOrders = ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    useDataStore.setState({ orders: sortedOrders });
                }, (error) => {
                    console.error("Error on orders snapshot listener:", error);
                });
            } else {
                useDataStore.setState({ orders: [] });
            }
        } else {
            useDataStore.setState({ orders: [] }); 
        }

        return () => {
            if(unsubRestaurants) unsubRestaurants();
            unsubMenuItems();
            if (unsubOrders) unsubOrders();
        }; 
    }, [user, activeRole]);
}

export const useData = useDataStore;

