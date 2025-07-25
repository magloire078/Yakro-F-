
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isGenerating: boolean;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], delivererId?: string) => Promise<void>;
  generateAllImages: () => Promise<void>;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

let unsubscribeFromOrders: () => void = () => {};

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
      // Fetch Restaurants and Menu Items
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

      // Listen to auth state to decide when to fetch orders
      onAuthStateChanged(auth, user => {
        // Unsubscribe from previous listener if it exists
        if (typeof unsubscribeFromOrders === 'function') {
            unsubscribeFromOrders();
        }

        if (user) {
          // If user is logged in, listen to orders
          const ordersCollection = collection(db, 'orders');
          unsubscribeFromOrders = onSnapshot(ordersCollection, (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            set({ orders: orderList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
          }, (error) => {
            console.error("Error in orders snapshot listener:", error);
          });
        } else {
          // If user is logged out, clear orders
          set({ orders: [] });
        }
      });

    } catch (error) {
      console.error("Error fetching data from Firestore: ", error);
      set({ restaurants: [], menuItems: [], orders: [] });
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

export const useData = useDataStore;

export const getRestaurantsForHistory = () => useDataStore.getState().restaurants;
