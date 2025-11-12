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
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { doc } from 'firebase/firestore';


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
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    try {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('data', JSON.stringify(data));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        await updateRestaurantAction(formData);
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: restaurantDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
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
        let publicDataLoaded = 0;
        let roleSpecificDataLoaded = false;
        
        const checkCompletion = () => {
            if (publicDataLoaded >= collectionsToFetch.length && (roleSpecificDataLoaded || !user)) {
                useDataStore.setState({ isLoading: false });
            }
        };

        // Subscribe to public data
        collectionsToFetch.forEach(collectionName => {
            const q = collection(db, collectionName);
            const unsub = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (collectionName === 'restaurants') {
                    useDataStore.setState({ restaurants: list as Restaurant[] });
                } else if (collectionName === 'plats') {
                    useDataStore.setState({ menuItems: list as MenuItem[] });
                }
                publicDataLoaded++;
                checkCompletion();
            }, (error) => {
                console.error(`Error on ${collectionName} snapshot listener:`, error);
                publicDataLoaded++;
                checkCompletion();
            });
            unsubscribes.push(unsub);
        });

        // Subscribe to Role-Specific Data
        if (user && userProfile) {
            let roleSpecificUnsub: Unsubscribe | null = null;
            
            // If user is SuperAdmin, only fetch all users data.
            if (userProfile.roleSysteme === 'SuperAdmin') {
                const usersCollection = collection(db, 'utilisateurs');
                roleSpecificUnsub = onSnapshot(usersCollection, (snapshot) => {
                    const usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                    useDataStore.setState({ allUsers: usersList });
                    roleSpecificDataLoaded = true;
                    checkCompletion();
                }, (error) => {
                    console.error("Error fetching all users:", error);
                    roleSpecificDataLoaded = true;
                    checkCompletion();
                });
            } 
            // Otherwise, fetch data based on the active functional role.
            else {
                 const allRestaurants = useDataStore.getState().restaurants;
                 const myRestaurantIds = allRestaurants
                  .filter(r => r.proprietaireId === user.uid)
                  .map(r => r.id);

                const ordersCollection = collection(db, 'commandes');
                let q: Query<DocumentData> | null = null;

                if (activeRole === 'client') {
                    q = query(ordersCollection, where("userId", "==", user.uid));
                } else if (activeRole === 'restaurateur' && myRestaurantIds.length > 0) {
                    q = query(ordersCollection, where('restaurantId', 'in', myRestaurantIds));
                } else if (activeRole === 'livreur') {
                    q = query(ordersCollection, or(
                        where("statut", "==", "En Préparation"),
                        where("livreurId", "==", user.uid)
                    ));
                } 
                
                if (q) {
                    roleSpecificUnsub = onSnapshot(q, (snapshot) => {
                        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                        const sortedOrders = ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        useDataStore.setState({ orders: sortedOrders });
                        roleSpecificDataLoaded = true;
                        checkCompletion();
                    }, (error) => {
                        console.error("Error on orders snapshot listener:", error);
                        roleSpecificDataLoaded = true;
                        checkCompletion();
                    });
                } else {
                     useDataStore.setState({ orders: [] });
                     roleSpecificDataLoaded = true;
                     checkCompletion();
                }
            }
            if (roleSpecificUnsub) {
                 unsubscribes.push(roleSpecificUnsub);
            }
        } else {
            // No user, no role-specific data to load
            roleSpecificDataLoaded = true;
            checkCompletion();
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
             useDataStore.setState({ 
                restaurants: [], 
                menuItems: [], 
                orders: [], 
                allUsers: [],
                isLoading: true,
            });
        };
    }, [user, userProfile, activeRole]);

  return <>{children}</>;
};


// Custom hook to use in components
export const useData = () => {
    const store = useDataStore();
    return store;
};
