

'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { create } from 'zustand';
import { collection, addDoc, doc, updateDoc, onSnapshot, writeBatch, query, where, Unsubscribe, DocumentData, Query, getDocs, deleteDoc, or } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from './auth-context';

// Helper function for uploading images
const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: {
    restaurants: boolean;
    menuItems: boolean;
    orders: boolean;
  };
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => Promise<void>;
  updateRestaurant: (restaurantId: string, data: Partial<Restaurant>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile: File | null) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>, imageFile: File | null) => Promise<void>;
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
  isLoading: {
    restaurants: true,
    menuItems: true,
    orders: true,
  },

  addRestaurant: async (restaurant) => {
    try {
      await addDoc(collection(db, "restaurants"), restaurant);
    } catch (e) {
      console.error("Error adding restaurant: ", e);
      throw e;
    }
  },

  updateRestaurant: async (restaurantId: string, data: Partial<Restaurant>) => {
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    try {
      await updateDoc(restaurantDocRef, data);
    } catch (e) {
      console.error("Error updating restaurant: ", e);
      throw e;
    }
  },

  addMenuItem: async (item, imageFile) => {
    try {
      // Create a mutable copy of the item
      const itemToAdd: any = { ...item };
      
      // If there's an image file, we don't store the preview URL in Firestore.
      // We will upload it and get a real URL later.
      if (imageFile) {
        delete itemToAdd.image;
      }
      
      const docRef = await addDoc(collection(db, "plats"), itemToAdd);
      const itemId = docRef.id;

      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, `plats/${itemId}`);
        await updateDoc(doc(db, "plats", itemId), { image: imageUrl });
      }

    } catch (e) {
      console.error("Error adding menu item: ", e);
      throw e;
    }
  },
  
  updateMenuItem: async (itemId, data, imageFile) => {
    const itemDocRef = doc(db, 'plats', itemId);
    try {
      const updateData: Partial<MenuItem> = { ...data };
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, `plats/${itemId}`);
        updateData.image = imageUrl;
      }
      await updateDoc(itemDocRef, updateData as DocumentData);
    } catch (e) {
      console.error("Error updating menu item: ", e);
      throw e;
    }
  },

  deleteMenuItem: async (itemId) => {
    const itemDocRef = doc(db, 'plats', itemId);
    try {
      // TODO: Delete image from storage as well
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

// This provider is a dummy for initial load, the real logic is in useRealtimeData
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRealtimeData();
  return <>{children}</>;
};

// This hook manages all realtime subscriptions
function useRealtimeData() {
    const { user, activeRole } = useAuth();
    const myRestaurants = useDataStore((state) => state.restaurants.filter(r => r.ownerId === user?.uid));


    // Subscribe to Restaurants
    React.useEffect(() => {
        useDataStore.setState(state => ({ isLoading: { ...state.isLoading, restaurants: true } }));
        const q = collection(db, "restaurants");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
            useDataStore.setState({ 
                restaurants: restaurantList,
                isLoading: { ...useDataStore.getState().isLoading, restaurants: false } 
            });
        }, (error) => {
            console.error("Error on restaurants snapshot listener:", error);
            useDataStore.setState(state => ({ isLoading: { ...state.isLoading, restaurants: false } }));
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to Menu Items
    React.useEffect(() => {
        useDataStore.setState(state => ({ isLoading: { ...state.isLoading, menuItems: true } }));
        const q = collection(db, "plats");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const menuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            useDataStore.setState({ 
                menuItems: menuList,
                isLoading: { ...useDataStore.getState().isLoading, menuItems: false } 
            });
        }, (error) => {
            console.error("Error on menuItems snapshot listener:", error);
            useDataStore.setState(state => ({ isLoading: { ...state.isLoading, menuItems: false } }));
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to Orders (dependent on user and role)
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        useDataStore.setState(state => ({ isLoading: { ...state.isLoading, orders: true } }));

        if (user) {
            const ordersCollection = collection(db, 'commandes');
            let q: Query<DocumentData> | null = null;

            if (activeRole === 'client') {
                q = query(ordersCollection, where("userId", "==", user.uid));
            } else if (activeRole === 'restaurateur') {
                const myRestaurantIds = myRestaurants
                    .filter(r => r.ownerId === user.uid)
                    .map(r => r.id);

                if (myRestaurantIds.length > 0) {
                    q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (activeRole === 'livreur') {
                // Livreur sees available orders, and any order assigned to them (active or completed)
                q = query(ordersCollection, or(
                    where("status", "==", "En Préparation"),
                    where("delivererId", "==", user.uid)
                ));
            }
            
            if (q) {
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                    const sortedOrders = ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    useDataStore.setState({ 
                        orders: sortedOrders,
                        isLoading: { ...useDataStore.getState().isLoading, orders: false }
                    });
                }, (error) => {
                    console.error("Error on orders snapshot listener:", error);
                    useDataStore.setState(state => ({ isLoading: { ...state.isLoading, orders: false } }));
                });
            } else {
                 useDataStore.setState({ orders: [], isLoading: { ...useDataStore.getState().isLoading, orders: false } });
            }
        } else {
            useDataStore.setState({ orders: [], isLoading: { ...useDataStore.getState().isLoading, orders: false } });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, activeRole, myRestaurants]); // Dependency on myRestaurants is crucial
}

const useCombinedLoadingState = () => {
    const { restaurants, menuItems, orders } = useDataStore(state => state.isLoading);
    return restaurants || menuItems || orders;
}

// Custom hook to use in components, combines loading state
export const useData = () => {
    const store = useDataStore();
    const combinedIsLoading = useCombinedLoadingState();
    return { ...store, isLoading: combinedIsLoading };
}
