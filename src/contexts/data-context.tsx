

'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
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
  allUsers: UserProfile[]; // New state for all users
  isLoading: boolean;
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
  allUsers: [],
  isLoading: true,

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


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile, activeRole } = useAuth();
    
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const collectionsToFetch = ['restaurants', 'plats'];
        const unsubscribes: Unsubscribe[] = [];

        collectionsToFetch.forEach(collectionName => {
            const q = collection(db, collectionName);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (collectionName === 'restaurants') {
                    useDataStore.setState({ restaurants: list as Restaurant[] });
                } else if (collectionName === 'plats') {
                    useDataStore.setState({ menuItems: list as MenuItem[] });
                }
            }, (error) => {
                console.error(`Error on ${collectionName} snapshot listener:`, error);
            });
            unsubscribes.push(unsubscribe);
        });

        // Combined loading state check
        const checkLoading = () => {
            const state = useDataStore.getState();
            if (state.restaurants.length > 0 && state.menuItems.length > 0) {
                 // The loading state will be properly handled by the orders subscription
            }
        };
        checkLoading();


        return () => unsubscribes.forEach(unsub => unsub());
    }, []);
    

    // Subscribe to Orders (dependent on user and role)
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        const myRestaurantIds = useDataStore.getState().restaurants
          .filter(r => r.ownerId === user?.uid)
          .map(r => r.id);

        if (user) {
            const ordersCollection = collection(db, 'commandes');
            let q: Query<DocumentData> | null = null;

            if (activeRole === 'client') {
                q = query(ordersCollection, where("userId", "==", user.uid));
            } else if (activeRole === 'restaurateur') {
                if (myRestaurantIds.length > 0) {
                    q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (activeRole === 'livreur') {
                q = query(ordersCollection, or(
                    where("status", "==", "En Préparation"),
                    where("delivererId", "==", user.uid)
                ));
            } else if (userProfile?.systemRole === 'SuperAdmin') {
                q = ordersCollection; // SuperAdmin sees all orders
            }
            
            if (q) {
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                    const sortedOrders = ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    useDataStore.setState({ orders: sortedOrders, isLoading: false });
                }, (error) => {
                    console.error("Error on orders snapshot listener:", error);
                    useDataStore.setState({ isLoading: false });
                });
            } else {
                 useDataStore.setState({ orders: [], isLoading: false });
            }
        } else {
            useDataStore.setState({ orders: [], isLoading: false });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, activeRole, userProfile?.systemRole, useDataStore.getState().restaurants]);


    // Subscribe to all users for SuperAdmin
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;

        if (userProfile?.systemRole === 'SuperAdmin') {
            const q = collection(db, 'utilisateurs');
            unsubscribe = onSnapshot(q, (snapshot) => {
                const usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                useDataStore.setState({ allUsers: usersList });
            }, (error) => {
                console.error("Error on allUsers snapshot listener:", error);
            });
        } else {
            useDataStore.setState({ allUsers: [] });
        }
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userProfile?.systemRole]);

  return <>{children}</>;
};


// Custom hook to use in components
export const useData = () => {
    const store = useDataStore();
    return store;
};
