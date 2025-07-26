
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
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
  setOrders: (orders: Order[]) => set({ orders }),

  fetchData: async () => {
    // This function now only fetches public data (restaurants and menu items)
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
      set({ restaurants: [], menuItems: [] });
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
    console.warn("generateAllImages only updates local state and does not persist to Firestore in this version.");
    try {
      const updatedMenuItems = await Promise.all(
        get().menuItems.map(async (item) => {
          if (item.image.startsWith('https://placehold.co')) {
            const { imageUrl } = await generateImage({ prompt: item.imageHint || item.name });
            return { ...item, image: imageUrl };
          }
          return item;
        })
      );
      set({ menuItems: updatedMenuItems });

      const updatedRestaurants = await Promise.all(
        get().restaurants.map(async (resto) => {
          if (resto.image.startsWith('https://placehold.co')) {
            const { imageUrl } = await generateImage({ prompt: resto.imageHint || resto.cuisine });
            return { ...resto, image: imageUrl };
          }
          return resto;
        })
      );
      set({ restaurants: updatedRestaurants });
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

// This hook is for components that need to listen to real-time order updates.
// It will only run if the user is authenticated.
export function useOrders() {
  const { user } = useAuth();
  const { setOrders } = useDataStore();

  React.useEffect(() => {
    if (!user) {
      setOrders([]); // Clear orders on logout
      return;
    }

    const ordersCollection = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(orderList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error("Error in orders snapshot listener:", error);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount or user change
  }, [user, setOrders]);
}


export const useData = useDataStore;

export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;

