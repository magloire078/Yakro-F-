
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialMenuItems, initialRestaurants } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  isGenerating: boolean;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  generateAllImages: () => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  isGenerating: false,
  isLoading: true,

  fetchData: async () => {
    // Prevent multiple fetches if already loading or data is present
    if (!get().isLoading && get().restaurants.length > 0) return;
    set({ isLoading: true });
    try {
      const restaurantsCollection = collection(db, 'restaurants');
      const restaurantSnapshot = await getDocs(restaurantsCollection);
      const restaurantList = restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      set({ restaurants: restaurantList.length > 0 ? restaurantList : initialRestaurants });

      const menuItemsCollection = collection(db, 'menuItems');
      const menuItemSnapshot = await getDocs(menuItemsCollection);
      const menuList = menuItemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      set({ menuItems: menuList.length > 0 ? menuList : initialMenuItems });
    } catch (error) {
      console.error("Error fetching data from Firestore, using initial data: ", error);
      set({ restaurants: initialRestaurants, menuItems: initialMenuItems });
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
        console.error("Error adding document: ", e);
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

// Initialize data fetching once
if (typeof window !== 'undefined') {
    useDataStore.getState().fetchData();
}

// The hook to be used in components
export const useData = useDataStore;

// This is needed for the user history generation helper which runs outside of React components
// It might be stale if used before data is fetched.
export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;
