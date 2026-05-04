'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, StockItem } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, Query, doc, deleteDoc, updateDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { useAuth } from './auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { deleteMenuItemAction } from '@/app/actions/menu-item-actions';

interface DataState {
    restaurants: Restaurant[];
    menuItems: MenuItem[];
    orders: Order[];
    stocks: StockItem[];
    isLoading: boolean;
    setRestaurants: (restaurants: Restaurant[]) => void;
    setMenuItems: (menuItems: MenuItem[]) => void;
    setOrders: (orders: Order[]) => void;
    setStocks: (stocks: StockItem[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    getMenuItem: (id: string) => MenuItem | undefined;
    getRestaurant: (id: string) => Restaurant | undefined;
    getOrder: (id: string) => Order | undefined;
    getStockItem: (id: string) => StockItem | undefined;
}

export const useData = create<DataState>((set, get) => ({
    restaurants: [],
    menuItems: [],
    orders: [],
    stocks: [],
    isLoading: true,
    setRestaurants: (restaurants) => set({ restaurants }),
    setMenuItems: (menuItems) => set({ menuItems }),
    setOrders: (orders) => set({ orders }),
    setStocks: (stocks) => set({ stocks }),
    setIsLoading: (isLoading) => set({ isLoading }),
    getMenuItem: (id: string) => {
        return get().menuItems.find(i => i.id === id);
    },
    getRestaurant: (id: string) => {
        return get().restaurants.find(r => r.id === id);
    },
    getOrder: (id: string) => {
        return get().orders.find(o => o.id === id);
    },
    getStockItem: (id: string) => {
        return get().stocks.find(s => s.id === id);
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
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as unknown as T[];
            callback(list);
        },
        (error) => {
            console.error(`Firestore error on ${collectionPath}:`, error);
            
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: collectionPath,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                errorEmitter.emit('firestore-error', error, {
                    path: collectionPath,
                    operation: 'list'
                });
            }
        }
    );
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { db } = useFirebase();
    const { user, userProfile, activeRole, loading: authLoading } = useAuth();
    const { setRestaurants, setMenuItems, setOrders, setStocks, setIsLoading, restaurants } = useData();

    React.useEffect(() => {
        if (!db) return;

        setIsLoading(true);
        const collectionRef = (path: string) => collection(db, path);

        const unsubRestaurants = setupSubscription<Restaurant>(query(collectionRef('restaurants')), setRestaurants, 'restaurants');
        const unsubMenuItems = setupSubscription<MenuItem>(query(collectionRef('plats')), setMenuItems, 'plats');

        const timer = setTimeout(() => setIsLoading(false), 2000);

        return () => {
            unsubRestaurants();
            unsubMenuItems();
            clearTimeout(timer);
        };
    }, [db, setRestaurants, setMenuItems, setIsLoading]);

    React.useEffect(() => {
        // Don't start role-specific listeners if auth is still loading, 
        // if user is not logged in, or if profile isn't ready.
        if (authLoading || !db || !user || !userProfile) {
            return;
        }

        let unsubOrders: Unsubscribe | undefined;
        let unsubOrders2: Unsubscribe | undefined; // Used for livreur split query
        let unsubStocks: Unsubscribe | undefined;
        const collectionRef = (path: string) => collection(db, path);

        if (user && userProfile) {
            let ordersQuery: Query | null = null;
            let stocksQuery: Query | null = null;

            if (userProfile.roleSysteme === 'SuperAdmin') {
                ordersQuery = query(collectionRef('commandes'));
                stocksQuery = query(collectionRef('stocks'));
            } else {
                switch (activeRole) {
                    case 'client':
                        ordersQuery = query(collectionRef('commandes'), where('userId', '==', user.uid));
                        break;
                    case 'restaurateur':
                        ordersQuery = query(collectionRef('commandes'), where('restaurateurId', '==', user.uid));

                        const myRestaurantIds = restaurants
                            .filter(r => r.proprietaireId === user.uid)
                            .map(r => r.id);

                        if (myRestaurantIds.length > 0) {
                            stocksQuery = query(collectionRef('stocks'), where('restaurateurId', '==', user.uid));
                        } else {
                            setStocks([]);
                        }
                        break;
                    case 'livreur':
                        // Split OR query into two separate simple queries to avoid Firestore
                        // permission evaluation issues with compound OR on realtime listeners.
                        // Query 1: orders available to pick up
                        ordersQuery = query(collectionRef('commandes'), where('statut', 'in', ['En Préparation', 'Placée', 'Prête']));
                        // Query 2 (livreur's own deliveries) is handled below via unsubOrders2
                        break;
                }
            }

            // Merge function for livreur's two separate queries
            const mergedOrdersRef = { current: [] as Order[] };
            const mergedAvailableRef = { current: [] as Order[] };

            if (ordersQuery) {
                if (activeRole === 'livreur') {
                    // Query 1: available orders
                    unsubOrders = setupSubscription<Order>(ordersQuery, (available) => {
                        mergedAvailableRef.current = available;
                        // Merge: available orders + livreur's own deliveries (deduplicated)
                        const myDeliveries = mergedOrdersRef.current;
                        const allIds = new Set(myDeliveries.map(o => o.id));
                        const merged = [...myDeliveries, ...available.filter(o => !allIds.has(o.id))];
                        setOrders(merged);
                        setIsLoading(false);
                    }, 'commandes');

                    // Query 2: livreur's own deliveries (En Route, Livrée)
                    const myDeliveriesQuery = query(collectionRef('commandes'), where('livreurId', '==', user.uid));
                    unsubOrders2 = setupSubscription<Order>(myDeliveriesQuery, (myDeliveries) => {
                        mergedOrdersRef.current = myDeliveries;
                        // Merge: available orders + livreur's own deliveries (deduplicated)
                        const available = mergedAvailableRef.current;
                        const allIds = new Set(myDeliveries.map(o => o.id));
                        const merged = [...myDeliveries, ...available.filter(o => !allIds.has(o.id))];
                        setOrders(merged);
                        setIsLoading(false);
                    }, 'commandes');
                } else {
                    unsubOrders = setupSubscription<Order>(ordersQuery, (fetchedOrders) => {
                        setOrders(fetchedOrders);
                        setIsLoading(false);
                    }, 'commandes');
                }
            } else {
                setOrders([]);
                setIsLoading(false);
            }

            if (stocksQuery) {
                unsubStocks = setupSubscription<StockItem>(stocksQuery, (fetchedStocks) => {
                    setStocks(fetchedStocks);
                }, 'stocks');
            } else {
                setStocks([]);
            }

        } else {
            // Not logged in or no profile - clear role-specific data
            setOrders([]);
            setStocks([]);
            setIsLoading(false);
        }

        return () => {
            if (unsubOrders) unsubOrders();
            if (unsubOrders2) unsubOrders2();
            if (unsubStocks) unsubStocks();
        };
    }, [db, user, userProfile, activeRole, authLoading, restaurants, setOrders, setStocks, setIsLoading]);

    return <>{children}</>;
};

export const deleteMenuItem = async (db: Firestore, itemId: string) => {
    try {
        await deleteMenuItemAction(itemId);
    } catch (e) {
        const itemDocRef = doc(db, 'plats', itemId);
        const permissionError = new FirestorePermissionError({
            path: itemDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};

export const updateRestaurant = async (db: Firestore, restaurantId: string, data: Partial<Restaurant>, imageFile: File | null = null) => {
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    const updateData: Partial<Restaurant> = { ...data };

    try {
        if (imageFile) {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
            
            if (!cloudName || !uploadPreset) throw new Error("Cloudinary config missing");

            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', uploadPreset);
            formData.append('public_id', `restaurants/${restaurantId}`);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const uploadResult = await response.json();
                updateData.image = uploadResult.secure_url;
            }
        }

        await updateDoc(restaurantDocRef, updateData);
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: restaurantDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};

export const deleteRestaurant = async (db: Firestore, restaurantId: string) => {
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    try {
        await deleteDoc(restaurantDocRef);
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: restaurantDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};

export const addStockItem = async (db: Firestore, stockData: Omit<StockItem, 'id'>) => {
    const stocksCollectionRef = collection(db, 'stocks');
    try {
        const docRef = doc(stocksCollectionRef);
        await updateDoc(docRef, { ...stockData, id: docRef.id });
        return docRef.id;
    } catch {
        // Fallback to setDoc since updateDoc might fail on non-existent auto-id doc in some restricted rules
        const docRef = doc(stocksCollectionRef);
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, { ...stockData, id: docRef.id });
        return docRef.id;
    }
};

export const updateStockItem = async (db: Firestore, stockId: string, data: Partial<StockItem>) => {
    const stockDocRef = doc(db, 'stocks', stockId);
    try {
        await updateDoc(stockDocRef, data);
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: stockDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};

export const deleteStockItem = async (db: Firestore, stockId: string) => {
    const stockDocRef = doc(db, 'stocks', stockId);
    try {
        await deleteDoc(stockDocRef);
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: stockDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};
