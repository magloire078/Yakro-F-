
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
    const { restaurants, setRestaurants, setMenuItems, setOrders, setIsLoading } = useData();
    const [authReady, setAuthReady] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading) {
            setAuthReady(true);
        }
    }, [authLoading]);
    
    React.useEffect(() => {
        if (!authReady || !db) {
            return;
        }

        setIsLoading(true);
        const collectionRef = (path: string) => collection(db, path);
        
        // Restaurants & MenuItems are public
        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, 'restaurants');
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, 'plats');
        
        let unsubOrders: Unsubscribe;
        if(user) {
             const myRestaurantIds = restaurants
                .filter(r => r.proprietaireId === user.uid)
                .map(r => r.id);

            // Base query for orders related to the user as a customer or deliverer
            let orderQuery = query(
                collectionRef('commandes'),
                or(
                  where('userId', '==', user.uid),
                  where('livreurId', '==', user.uid)
                )
            );
            
            // If the user is a restaurateur and has restaurants, we also get their orders
            if (activeRole === 'restaurateur' && myRestaurantIds.length > 0) {
                 orderQuery = query(
                    collectionRef('commandes'),
                    or(
                      where('userId', '==', user.uid),
                      where('livreurId', '==', user.uid),
                      where('restaurantId', 'in', myRestaurantIds)
                    )
                 )
            }
             unsubOrders = setupSubscription<Order>(orderQuery, setOrders, 'commandes');

        } else {
            // If no user, don't subscribe to orders
            setOrders([]);
            unsubOrders = () => {};
        }


        const timer = setTimeout(() => setIsLoading(false), 500);
        
        return () => {
            unsubRestaurants();
            unsubMenuItems();
            unsubOrders();
            clearTimeout(timer);
        };
    }, [authReady, db, user, activeRole, restaurants, setIsLoading, setRestaurants, setMenuItems, setOrders]);

    return <>{children}</>;
};
