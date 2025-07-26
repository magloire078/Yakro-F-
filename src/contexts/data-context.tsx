

'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, Unsubscribe, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isGenerating: boolean;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], delivererId?: string) => Promise<void>;
  generateAllImages: () => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isGenerating: false,
  isLoading: true,
  setOrders: (orders: Order[]) => {
      const allOrders = [...get().orders, ...orders];
      const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
      set({ orders: uniqueOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
  },

  fetchData: async () => {
    // Prevent re-fetching if data is already loaded.
    if (!get().isLoading && get().restaurants.length > 0) {
      return;
    }
    set({ isLoading: true });
    try {
      const restaurantsCollection = collection(db, 'restaurants');
      const menuItemsCollection = collection(db, 'menuItems');

      let restaurantSnapshot = await getDocs(restaurantsCollection);
      if (restaurantSnapshot.empty) {
        console.log("Firestore 'restaurants' is empty. Seeding data...");
        const batch = writeBatch(db);
        initialRestaurants.forEach(resto => {
          const docRef = doc(restaurantsCollection);
          batch.set(docRef, resto);
        });
        await batch.commit();
        restaurantSnapshot = await getDocs(restaurantsCollection);
      }
      const restaurantList = restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      set({ restaurants: restaurantList });

      let menuItemSnapshot = await getDocs(menuItemsCollection);
      if (menuItemSnapshot.empty && restaurantList.length > 0) {
        console.log("Firestore 'menuItems' is empty. Seeding data...");
        const batch = writeBatch(db);
        initialMenuItems.forEach(item => {
          const docRef = doc(menuItemsCollection);
          const restaurant = restaurantList.find(r => r.imageHint.includes(item.imageHint.split(' ')[0]));
          batch.set(docRef, { ...item, restaurantId: restaurant?.id || restaurantList[0].id });
        });
        await batch.commit();
        menuItemSnapshot = await getDocs(menuItemsCollection);
      }
      const menuList = menuItemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      set({ menuItems: menuList });

    } catch (error) {
      console.error("Error fetching public data from Firestore: ", error);
      // Fallback to initial data if Firestore fetch fails
      set({ restaurants: initialRestaurants, menuItems: initialMenuItems });
    } finally {
      set({ isLoading: false });
    }
  },

  addMenuItem: async (item) => {
    try {
      const docRef = await addDoc(collection(db, "menuItems"), item);
      const newItem = { id: docRef.id, ...item } as MenuItem;
      set(state => ({ menuItems: [...state.menuItems, newItem] }));
    } catch (e) {
      console.error("Error adding menu item: ", e);
      throw e;
    }
  },

  addOrder: async (order) => {
    try {
      await addDoc(collection(db, "orders"), order);
    } catch (e) {
      console.error("Error adding order: ", e);
      throw e;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status'], delivererId?: string) => {
    const orderDocRef = doc(db, 'orders', orderId);
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

  generateAllImages: async () => {
    set({ isGenerating: true });
    
    // This function will now update Firestore as well as the local state.
    const batch = writeBatch(db);
    try {
      const updatedMenuItems = await Promise.all(
        get().menuItems.map(async (item) => {
          if (item.image.startsWith('https://placehold.co')) {
            const { imageUrl } = await generateImage({ prompt: item.imageHint || item.name });
            const itemRef = doc(db, 'menuItems', item.id);
            batch.update(itemRef, { image: imageUrl });
            return { ...item, image: imageUrl };
          }
          return item;
        })
      );

      const updatedRestaurants = await Promise.all(
        get().restaurants.map(async (resto) => {
          if (resto.image.startsWith('https://placehold.co')) {
            const { imageUrl } = await generateImage({ prompt: resto.imageHint || resto.cuisine });
            const restoRef = doc(db, 'restaurants', resto.id);
            batch.update(restoRef, { image: imageUrl });
            return { ...resto, image: imageUrl };
          }
          return resto;
        })
      );
      
      await batch.commit();
      set({ menuItems: updatedMenuItems, restaurants: updatedRestaurants });

    } catch(error) {
        console.error("Error generating or updating images in Firestore:", error);
    } finally {
      set({ isGenerating: false });
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
  const store = useDataStore();
  return <>{children}</>;
};

export function useOrders() {
  const { user } = useAuth();
  const setOrders = useDataStore(state => state.setOrders);
  const currentOrdersRef = React.useRef<Map<string, Order>>(new Map());

  React.useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const ordersCollection = collection(db, 'orders');
    let unsubscribes: Unsubscribe[] = [];

    const setupSubscription = (q: Query<DocumentData, DocumentData>, source: string) => {
       const unsub = onSnapshot(q, (snapshot) => {
            let changed = false;
            snapshot.docChanges().forEach((change) => {
                changed = true;
                if (change.type === 'removed') {
                    currentOrdersRef.current.delete(change.doc.id);
                } else {
                    currentOrdersRef.current.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as Order);
                }
            });
            if(changed) {
                const sortedOrders = Array.from(currentOrdersRef.current.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setOrders(sortedOrders);
            }
        }, (error) => {
            console.error(`Error on snapshot listener for ${source}:`, error);
        });
        unsubscribes.push(unsub);
    }

    // Queries for a logged-in user
    const customerQuery = query(ordersCollection, where("userId", "==", user.uid));
    setupSubscription(customerQuery, 'customer');

    const delivererQuery = query(ordersCollection, where("delivererId", "==", user.uid));
    setupSubscription(delivererQuery, 'deliverer');

    const availableDeliveriesQuery = query(ordersCollection, where("status", "==", "Placée"));
    setupSubscription(availableDeliveriesQuery, 'available');

    return () => {
        unsubscribes.forEach(unsub => unsub());
    }; 
  }, [user, setOrders]);
}


export const useData = useDataStore;

export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;
