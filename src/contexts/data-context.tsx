
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
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
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
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
    if (!get().isLoading && get().restaurants.length > 0) {
      return;
    }
    set({ isLoading: true });
    try {
      // Fetch Restaurants
      const restaurantsCollection = collection(db, 'restaurants');
      let restaurantSnapshot = await getDocs(restaurantsCollection);
      
      // Seed restaurants if collection is empty
      if (restaurantSnapshot.empty) {
        const batch = writeBatch(db);
        initialRestaurants.forEach(resto => {
          const docRef = doc(restaurantsCollection);
          batch.set(docRef, resto);
        });
        await batch.commit();
        restaurantSnapshot = await getDocs(restaurantsCollection); // Re-fetch after seeding
        console.log("Firestore 'restaurants' collection seeded.");
      }
      const restaurantList = restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      set({ restaurants: restaurantList });

      // Fetch Menu Items
      const menuItemsCollection = collection(db, 'menuItems');
      let menuItemSnapshot = await getDocs(menuItemsCollection);

      // Seed menu items if collection is empty
      if (menuItemSnapshot.empty && restaurantList.length > 0) {
        const batch = writeBatch(db);
        const afrinaRestoId = restaurantList.find(r => r.name === 'Le Bazin')?.id;
        const piliPiliRestoId = restaurantList.find(r => r.name === 'Le Pili Pili')?.id;
        const pizzaDoudouRestoId = restaurantList.find(r => r.name === 'Pizza Doudou')?.id;

        if (piliPiliRestoId && afrinaRestoId && pizzaDoudouRestoId) {
            initialMenuItems.forEach(item => {
                const docRef = doc(menuItemsCollection);
                let restaurantId = afrinaRestoId; // default
                if(item.name.includes('Poulet') || item.name.includes('Attiéké')) restaurantId = piliPiliRestoId;
                if(item.name.includes('Pizza')) restaurantId = pizzaDoudouRestoId;

                batch.set(docRef, {...item, restaurantId});
            });
            await batch.commit();
            menuItemSnapshot = await getDocs(menuItemsCollection); // Re-fetch
            console.log("Firestore 'menuItems' collection seeded.");
        }
      }

      const menuList = menuItemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      set({ menuItems: menuList });


      // Fetch Orders initially and then listen for real-time updates
      const ordersCollection = collection(db, 'orders');
      onSnapshot(ordersCollection, (snapshot) => {
        const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        set({ orders: orderList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
      });

    } catch (error) {
      console.error("Error fetching data from Firestore: ", error);
       // In case of error, set to empty arrays, relying on Firestore as the source of truth
      set({ restaurants: [], menuItems: [], orders: [] });
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
        await addDoc(collection(db, "orders"), order);
        // The real-time listener will add the order to the state.
    } catch (e) {
        console.error("Error adding order: ", e);
        throw e;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    const orderDocRef = doc(db, 'orders', orderId);
    try {
        await updateDoc(orderDocRef, { status });
        // The real-time listener will automatically update the local state.
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

export const useData = useDataStore;

// This is needed for the user history generation helper which runs outside of React components
export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;
