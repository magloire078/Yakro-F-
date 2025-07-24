
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialMenuItems, initialRestaurants } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isGenerating: boolean;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
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

  fetchData: async () => {
    // Prevent multiple fetches if already loading or data is present
    if (get().restaurants.length > 0 && get().orders.length > 0) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      // Fetch Restaurants
      const restaurantsCollection = collection(db, 'restaurants');
      const restaurantSnapshot = await getDocs(restaurantsCollection);
      const restaurantList = restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      set({ restaurants: restaurantList.length > 0 ? restaurantList : initialRestaurants });

      // Fetch Menu Items
      const menuItemsCollection = collection(db, 'menuItems');
      const menuItemSnapshot = await getDocs(menuItemsCollection);
      const menuList = menuItemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      set({ menuItems: menuList.length > 0 ? menuList : initialMenuItems });

      // Fetch Orders
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      const orderList = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      set({ orders: orderList });

    } catch (error) {
      console.error("Error fetching data from Firestore, using initial data: ", error);
      set({ restaurants: initialRestaurants, menuItems: initialMenuItems, orders: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addMenuItem: async (item) => {
    try {
        const docRef = await addDoc(collection(db, "menuItems"), item);
        const newItem = { id: docRef.id, ...item };
        set(state => ({ menuItems: [...state.menuItems, newItem]}));
    } catch (e) {
        console.error("Error adding menu item: ", e);
        throw e;
    }
  },

  addOrder: async (order) => {
    try {
        const docRef = await addDoc(collection(db, "orders"), order);
        const newOrder = { id: docRef.id, ...order };
        set(state => ({ orders: [...state.orders, newOrder]}));
    } catch (e) {
        console.error("Error adding order: ", e);
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

export const useData = useDataStore;

// This is needed for the user history generation helper which runs outside of React components
// It might be stale if used before data is present.
export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;
