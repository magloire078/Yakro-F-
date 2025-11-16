
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, UserProfile } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, getDocs, Query, or } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { useAuth } from './auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


interface DataState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  isLoading: boolean;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  setOrders: (orders: Order[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  getMenuItem: (id: string) => MenuItem | undefined;
  getRestaurant: (id: string) => Restaurant | undefined;
  getOrder: (id: string) => Order | undefined;
}

export const useData = create<DataState>((set, get) => ({
  restaurants: [],
  menuItems: [],
  orders: [],
  isLoading: true,
  setRestaurants: (restaurants) => set({ restaurants }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setOrders: (orders) => set({ orders }),
  setIsLoading: (isLoading) => set({ isLoading }),
  getMenuItem: (id: string) => {
    return get().menuItems.find(i => i.id === id);
  },
  getRestaurant: (id: string) => {
    return get().restaurants.find(r => r.id === id);
  },
  getOrder: (id: string) => {
    return get().orders.find(o => o.id === id);
  }
}));

function setupSubscription<T extends DocumentData>(
  q: Query<DocumentData, DocumentData>,
  callback: (data: T[]) => void,
  collectionPath: string
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      callback(list);
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collectionPath,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error(`Error subscribing to ${collectionPath}:`, serverError);
    }
  );
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { db } = useFirebase();
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setIsLoading, restaurants } = useData();

    // Step 1: Subscribe to public data that everyone can see.
    React.useEffect(() => {
        if (!db) return;
        
        setIsLoading(true);
        const collectionRef = (path: string) => collection(db, path);
        
        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, 'restaurants');
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, 'plats');
        
        // We set a timer to ensure loading state isn't stuck if orders never load
        const timer = setTimeout(() => setIsLoading(false), 2000);

        return () => {
            unsubRestaurants();
            unsubMenuItems();
            clearTimeout(timer);
        };
    }, [db, setRestaurants, setMenuItems, setIsLoading]);


    // Step 2: Subscribe to user-specific/role-specific data (like orders)
    // This useEffect depends on the user, their role, and the already loaded restaurants
    React.useEffect(() => {
        if (authLoading || !db) {
            return;
        }

        let unsubOrders: Unsubscribe | undefined;
        const collectionRef = (path: string) => collection(db, path);

        if (user && userProfile) {
            let ordersQuery: Query | null = null;
            
            if (userProfile.roleSysteme === 'SuperAdmin') {
                ordersQuery = query(collectionRef('commandes'));
            } else {
                switch (activeRole) {
                    case 'client':
                        ordersQuery = query(collectionRef('commandes'), where('userId', '==', user.uid));
                        break;
                    case 'restaurateur':
                        // Only run this if restaurants are loaded
                        if (restaurants.length > 0) {
                            const myRestaurantIds = restaurants
                                .filter(r => r.proprietaireId === user.uid)
                                .map(r => r.id);

                            if (myRestaurantIds.length > 0) {
                                // Firestore 'in' queries are limited to 30 elements. If a user has more, this would need pagination.
                                ordersQuery = query(collectionRef('commandes'), where('restaurantId', 'in', myRestaurantIds));
                            } else {
                                // No restaurants owned by this user, so no orders to fetch.
                                setOrders([]);
                            }
                        }
                        // If restaurants are not loaded yet, this effect will re-run when they are.
                        break;
                    case 'livreur':
                         ordersQuery = query(collectionRef('commandes'), or(
                            where('statut', '==', 'En Préparation'),
                            where('livreurId', '==', user.uid)
                        ));
                        break;
                }
            }

            if (ordersQuery) {
                unsubOrders = setupSubscription<Order>(ordersQuery, (fetchedOrders) => {
                    setOrders(fetchedOrders);
                    setIsLoading(false); // Stop loading once orders are fetched/updated
                }, 'commandes');
            } else if (activeRole !== 'restaurateur') { // for restaurateur, query might be pending restaurant load
                setOrders([]);
                setIsLoading(false);
            }

        } else {
            // No user, clear orders and stop loading.
            setOrders([]);
            setIsLoading(false);
        }

        return () => {
            if (unsubOrders) {
                unsubOrders();
            }
        };
    }, [db, user, userProfile, activeRole, authLoading, restaurants, setOrders, setIsLoading]);


    return <>{children}</>;
};
