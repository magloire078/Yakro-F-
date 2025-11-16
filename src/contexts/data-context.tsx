
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
    const { setRestaurants, setMenuItems, setOrders, setIsLoading } = useData();
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
        
        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, 'restaurants');
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, 'plats');
        
        let unsubOrders: Unsubscribe = () => {};
        
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
                        // Simplified query: Find all orders where the owner ID matches.
                        // This avoids the circular dependency on the restaurants list.
                        // Note: This requires a composite index on (proprietaireId, date) for sorting,
                        // or we just fetch them and sort client-side. The security rules must also
                        // allow this type of query based on a different collection's data.
                        // For now, let's query all restaurants and filter client-side, it's safer.
                        
                        // We will revert to a simpler model: A restaurateur sees orders for their restaurants.
                        // The circular dependency is a real issue. Let's fix it by not having `restaurants` in dependency array.
                        // The query will be rebuilt if the user/role changes, but not if restaurants list changes. 
                        // It will use the restaurant list available at the time of query creation.
                        // A better way is to query orders based on owner ID, but that requires a data model change.
                        // Let's go for a query that does not depend on `restaurants` state.
                        
                        // This logic is complex and might fail if security rules are strict.
                        // A restaurateur should only see orders from restaurants they own.
                        // A better query would be to fetch restaurants owned by the user first.
                        const restaurantsOwnedByUserQuery = query(collectionRef('restaurants'), where('proprietaireId', '==', user.uid));
                        
                        getDocs(restaurantsOwnedByUserQuery).then(snapshot => {
                            const myRestaurantIds = snapshot.docs.map(doc => doc.id);
                             if (myRestaurantIds.length > 0) {
                                const ordersForMyRestaurantsQuery = query(collectionRef('commandes'), where('restaurantId', 'in', myRestaurantIds));
                                unsubOrders = setupSubscription<Order>(ordersForMyRestaurantsQuery, setOrders, 'commandes');
                            } else {
                                setOrders([]);
                            }
                        });
                        
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
                unsubOrders = setupSubscription<Order>(ordersQuery, setOrders, 'commandes');
            } else if (activeRole !== 'restaurateur') {
                setOrders([]);
            }

        } else {
            setOrders([]);
        }


        const timer = setTimeout(() => setIsLoading(false), 1000); // Increased timeout slightly
        
        return () => {
            unsubRestaurants();
            unsubMenuItems();
            if (unsubOrders) unsubOrders();
            clearTimeout(timer);
        };
    }, [authReady, db, user, userProfile, activeRole, setIsLoading, setRestaurants, setMenuItems, setOrders]);

    return <>{children}</>;
};
