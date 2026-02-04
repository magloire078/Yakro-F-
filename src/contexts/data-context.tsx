'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, Query, or } from 'firebase/firestore';
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
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collectionPath,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  );
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { db } = useFirebase();
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setIsLoading, restaurants } = useData();

    React.useEffect(() => {
        if (!db) return;
        
        setIsLoading(true);
        const collectionRef = (path: string) => collection(db, path);
        
        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, 'restaurants');
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, 'plats');
        
        const timer = setTimeout(() => setIsLoading(false), 3000);

        return () => {
            unsubRestaurants();
            unsubMenuItems();
            clearTimeout(timer);
        };
    }, [db, setRestaurants, setMenuItems, setIsLoading]);

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
                        const myRestaurantIds = restaurants
                            .filter(r => r.proprietaireId === user.uid)
                            .map(r => r.id);

                        if (myRestaurantIds.length > 0) {
                            ordersQuery = query(collectionRef('commandes'), where('restaurantId', 'in', myRestaurantIds));
                        } else {
                            setOrders([]);
                        }
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
                    setIsLoading(false);
                }, 'commandes');
            } else {
                setOrders([]);
                setIsLoading(false);
            }

        } else {
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
