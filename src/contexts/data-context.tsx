
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import { create } from 'zustand';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, Unsubscribe, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { SUPER_USER_EMAIL } from '@/lib/types';

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

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isGenerating: false,
  isLoading: true,

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
      
      let menuItemSnapshot = await getDocs(menuItemsCollection);
      const restaurantList = restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
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
      await addDoc(collection(db, "menuItems"), item);
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
    
    const batch = writeBatch(db);
    try {
      const menuItemsToUpdate = get().menuItems.filter(item => item.image.startsWith('https://placehold.co'));
      const restaurantsToUpdate = get().restaurants.filter(resto => resto.image.startsWith('https://placehold.co'));

      await Promise.all(
        menuItemsToUpdate.map(async (item) => {
          const { imageUrl } = await generateImage({ prompt: item.imageHint || item.name });
          const itemRef = doc(db, 'menuItems', item.id);
          batch.update(itemRef, { image: imageUrl });
        })
      );
      
      await Promise.all(
         restaurantsToUpdate.map(async (resto) => {
          const { imageUrl } = await generateImage({ prompt: resto.imageHint || resto.cuisine });
          const restoRef = doc(db, 'restaurants', resto.id);
          batch.update(restoRef, { image: imageUrl });
        })
      );
      
      await batch.commit();

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
  const { fetchData } = useDataStore();
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeData();

  return <>{children}</>;
};

function useRealtimeData() {
    const { user } = useAuth();

    React.useEffect(() => {
        // Restaurants Listener
        const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snapshot) => {
            const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
            useDataStore.setState({ restaurants: restaurantList, isLoading: false });
        }, (error) => {
             console.error("Error on restaurants snapshot listener:", error);
        });

        // Menu Items Listener
        const unsubMenuItems = onSnapshot(collection(db, "menuItems"), (snapshot) => {
            const menuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            useDataStore.setState({ menuItems: menuList });
        }, (error) => {
             console.error("Error on menuItems snapshot listener:", error);
        });

        // Orders Listener
        let unsubOrders: Unsubscribe | null = null;
        if (user) {
            const ordersCollection = collection(db, 'orders');
            
            const currentOrdersRef = new Map<string, Order>();
            let orderUnsubscribes: Unsubscribe[] = [];

            const setupSubscription = (q: Query<DocumentData, DocumentData>) => {
               const unsub = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'removed') {
                            currentOrdersRef.delete(change.doc.id);
                        } else {
                            const orderData = { id: change.doc.id, ...change.doc.data() } as Order;
                             // For super user, avoid overwriting if a more specific query already added the doc
                            if(user.email === SUPER_USER_EMAIL && currentOrdersRef.has(orderData.id) && q.type === 'collection') return;
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

            // Regular user sees only their orders
            setupSubscription(query(ordersCollection, where("userId", "==", user.uid)));
            
            // Super user sees all active orders for all users
            if(user.email === SUPER_USER_EMAIL) {
                setupSubscription(query(ordersCollection, where("status", "in", ["Placée", "En Préparation", "En Route"])));
            }

            unsubOrders = () => orderUnsubscribes.forEach(unsub => unsub());

        } else {
            useDataStore.setState({ orders: [] }); // Clear orders on logout
        }

        return () => {
            unsubRestaurants();
            unsubMenuItems();
            if (unsubOrders) unsubOrders();
        }; 
    }, [user]);
}

export const useData = useDataStore;

// This hook is now obsolete and can be removed, but we keep it for compatibility with existing components
// until they are all verified to not use it.
export const useOrders = () => {};
