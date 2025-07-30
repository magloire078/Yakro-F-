
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { create } from 'zustand';
import { collection, addDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, Unsubscribe, DocumentData, Query, getDocs, deleteDoc } from 'firebase/firestore';
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

        // Restaurants Listener
        let unsubRestaurants: Unsubscribe | null = null;
        const restaurantsCollection = collection(db, "restaurants");

        if (user && activeRole === 'restaurateur') {
            // Restaurateur sees only their own restaurants
            const q = query(restaurantsCollection, where("ownerId", "==", user.uid));
            unsubRestaurants = onSnapshot(q, (snapshot) => {
                const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
                useDataStore.setState({ restaurants: restaurantList, isLoading: false });
            }, (error) => {
                 console.error("Error on restaurateur's restaurants snapshot listener:", error);
                 useDataStore.setState({ isLoading: false });
            });
        } else {
            // Other roles see all restaurants
            unsubRestaurants = onSnapshot(restaurantsCollection, (snapshot) => {
                const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
                useDataStore.setState({ restaurants: restaurantList, isLoading: false });
            }, (error) => {
                 console.error("Error on all restaurants snapshot listener:", error);
                 useDataStore.setState({ isLoading: false });
            });
        }
        

        // Menu Items Listener - shows all menu items for simplicity
        const unsubMenuItems = onSnapshot(collection(db, "plats"), (snapshot) => {
            const menuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            useDataStore.setState({ menuItems: menuList });
        }, (error) => {
             console.error("Error on menuItems snapshot listener:", error);
        });

        // Orders Listener
        let unsubOrders: Unsubscribe | null = null;
        if (user) {
            const ordersCollection = collection(db, 'commandes');
            
            const currentOrdersRef = new Map<string, Order>();
            let orderUnsubscribes: Unsubscribe[] = [];

            const setupSubscription = (q: Query<DocumentData, DocumentData>) => {
               const unsub = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        const orderData = { id: change.doc.id, ...change.doc.data() } as Order;
                        if (change.type === 'removed') {
                            currentOrdersRef.delete(change.doc.id);
                        } else {
                            currentOrdersRef.set(change.doc.id, orderData);
                        }
                    });
                    const sortedOrders = Array.from(currentOrdersRef.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    useDataStore.setState({ orders: sortedOrders });
                }, (error) => {
                    console.error(`Error on orders snapshot listener:`, error);
                });
                orderUnsubscribes.push(unsub);
            }

            // Always fetch orders for the logged-in user, regardless of role.
            setupSubscription(query(ordersCollection, where("userId", "==", user.uid)));
            
            // If restaurateur, also get all orders placed at their restaurants.
            // This logic assumes `myRestaurantIds` is available from another part of the state.
            // A more robust implementation might fetch these IDs first.
            if (activeRole === 'restaurateur') {
                 // For simplicity, we get all Placed/Preparing orders. A production app would
                 // query based on an array of the user's restaurant IDs.
                 setupSubscription(query(ordersCollection, where("status", "in", ["Placée", "En Préparation"])));
            }

            // If livreur, get all orders ready for pickup and those they are delivering.
            if (activeRole === 'livreur') {
                setupSubscription(query(ordersCollection, where("status", "==", "En Préparation")));
                setupSubscription(query(ordersCollection, where("delivererId", "==", user.uid)));
            }
            
            unsubOrders = () => orderUnsubscribes.forEach(unsub => unsub());

        } else {
            useDataStore.setState({ orders: [] }); // Clear orders on logout
        }

        return () => {
            if(unsubRestaurants) unsubRestaurants();
            unsubMenuItems();
            if (unsubOrders) unsubOrders();
        }; 
    }, [user, activeRole]);
}

export const useData = useDataStore;
