
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, where, Unsubscribe, DocumentData, Query, or, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

// Import server actions
import { addRestaurantAction, updateRestaurantAction } from '@/app/actions/restaurant-actions';
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction } from '@/app/actions/menu-item-actions';
import { addOrderAction, updateOrderStatusAction } from '@/app/actions/order-actions';


interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  allUsers: UserProfile[];
  isLoading: boolean;
  addRestaurant: (data: Omit<Restaurant, 'id'>, imageFile: File | null) => Promise<void>;
  updateRestaurant: (restaurantId: string, data: Partial<Restaurant>, imageFile: File | null) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile: File | null) => Promise<void>;
  updateMenuItem: (itemId: string, data: Partial<MenuItem>, imageFile: File | null) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['statut'], delivererId?: string) => Promise<void>;
  fetchAllUsers: () => Unsubscribe;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
}

const useDataStore = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  allUsers: [],
  isLoading: true,

  addRestaurant: async (data, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await addRestaurantAction(formData);
  },

  updateRestaurant: async (restaurantId, data, imageFile) => {
    const formData = new FormData();
    formData.append('restaurantId', restaurantId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await updateRestaurantAction(formData);
  },

  addMenuItem: async (item, imageFile) => {
    const formData = new FormData();
    formData.append('item', JSON.stringify(item));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    await addMenuItemAction(formData);
  },
  
  updateMenuItem: async (itemId, data, imageFile) => {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('data', JSON.stringify(data));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    await updateMenuItemAction(formData);
  },

  deleteMenuItem: async (itemId) => {
    await deleteMenuItemAction(itemId);
  },

  addOrder: async (order) => {
    await addOrderAction(order);
  },

  updateOrderStatus: async (orderId, status, delivererId) => {
    await updateOrderStatusAction({ orderId, status, delivererId });
  },

  fetchAllUsers: () => {
      const usersCollection = collection(db, 'utilisateurs');
      const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
          const usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
          set({ allUsers: usersList });
      }, (error) => {
          console.error("Error fetching all users:", error);
          set({ allUsers: [] });
      });
      return unsubscribe;
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
    const fetchAllUsers = useDataStore((state) => state.fetchAllUsers);
    
    // Subscribe to public data (restaurants, menuItems)
    React.useEffect(() => {
        useDataStore.setState({ isLoading: true });

        const collectionsToFetch = ['restaurants', 'plats'];
        const unsubscribes: Unsubscribe[] = [];

        const promises = collectionsToFetch.map(collectionName => new Promise<void>((resolve, reject) => {
            const q = collection(db, collectionName);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (collectionName === 'restaurants') {
                    useDataStore.setState({ restaurants: list as Restaurant[] });
                } else if (collectionName === 'plats') {
                    useDataStore.setState({ menuItems: list as MenuItem[] });
                }
                resolve();
            }, (error) => {
                console.error(`Error on ${collectionName} snapshot listener:`, error);
                reject(error);
            });
            unsubscribes.push(unsubscribe);
        }));

        Promise.all(promises).catch(() => {
             // If public data fails to load, we might still want to stop loading
             // depending on the app's requirements. For now, orders will control the final loading state.
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);
    

    // Subscribe to Orders (dependent on user and role)
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        // Ensure restaurants data is available before proceeding for roles that depend on it
        const allRestaurants = useDataStore.getState().restaurants;

        if (user && userProfile) {
             const myRestaurantIds = allRestaurants
              .filter(r => r.proprietaireId === user.uid)
              .map(r => r.id);

            const ordersCollection = collection(db, 'commandes');
            let q: Query<DocumentData> | null = null;

            if (activeRole === 'client') {
                q = query(ordersCollection, where("userId", "==", user.uid));
            } else if (activeRole === 'restaurateur' && userProfile?.roleSysteme === 'SuperAdmin') {
                q = ordersCollection;
            } else if (activeRole === 'restaurateur') {
                if (myRestaurantIds.length > 0) {
                    q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                }
            } else if (activeRole === 'livreur') {
                q = query(ordersCollection, or(
                    where("statut", "==", "En Préparation"),
                    where("livreurId", "==", user.uid)
                ));
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
    }, [user, userProfile, activeRole, useDataStore.getState().restaurants]);


    // Fetch all users for SuperAdmin
    React.useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        if (userProfile?.roleSysteme === 'SuperAdmin') {
            unsubscribe = fetchAllUsers();
        } else {
             useDataStore.setState({ allUsers: [] });
        }
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        }
    }, [userProfile?.roleSysteme, fetchAllUsers]);

  return <>{children}</>;
};


// Custom hook to use in components
export const useData = () => {
    const store = useDataStore();
    return store;
};
