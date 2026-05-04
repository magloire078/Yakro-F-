'use client';

import * as React from 'react';
import type { Restaurant, MenuItem, Order, StockItem, AppNotification } from '@/lib/types';
import { create } from 'zustand';
import { collection, onSnapshot, query, Unsubscribe, DocumentData, where, Query, or, doc, deleteDoc, updateDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { useAuth } from './auth-context';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface DataState {
    restaurants: Restaurant[];
    menuItems: MenuItem[];
    orders: Order[];
    stocks: StockItem[];
    notifications: AppNotification[];
    isLoading: boolean;
    setRestaurants: (restaurants: Restaurant[]) => void;
    setMenuItems: (menuItems: MenuItem[]) => void;
    setOrders: (orders: Order[]) => void;
    setStocks: (stocks: StockItem[]) => void;
    setNotifications: (notifications: AppNotification[]) => void;
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
    notifications: [],
    isLoading: true,
    setRestaurants: (restaurants) => set({ restaurants }),
    setMenuItems: (menuItems) => set({ menuItems }),
    setOrders: (orders) => set({ orders }),
    setStocks: (stocks) => set({ stocks }),
    setNotifications: (notifications) => set({ notifications }),
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
        () => {
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
    const { setRestaurants, setMenuItems, setOrders, setStocks, setNotifications, setIsLoading, restaurants } = useData();

    React.useEffect(() => {
        if (!db || authLoading) return;

        if (!user) {
            setRestaurants([]);
            setMenuItems([]);
            setIsLoading(false);
            return;
        }

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
    }, [db, user, authLoading, setRestaurants, setMenuItems, setIsLoading]);

    React.useEffect(() => {
        if (authLoading || !db) {
            return;
        }

        let unsubOrders: Unsubscribe | undefined;
        let unsubStocks: Unsubscribe | undefined;
        let unsubNotifications: Unsubscribe | undefined;
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

            if (stocksQuery) {
                unsubStocks = setupSubscription<StockItem>(stocksQuery, (fetchedStocks) => {
                    setStocks(fetchedStocks);
                }, 'stocks');
            } else {
                setStocks([]);
            }

            const notifQuery = query(collectionRef('notifications'), where('userId', '==', user.uid));
            unsubNotifications = setupSubscription<AppNotification>(notifQuery, (fetched) => {
                setNotifications(fetched);
            }, 'notifications');

        } else {
            setOrders([]);
            setStocks([]);
            setNotifications([]);
            setIsLoading(false);
        }

        return () => {
            if (unsubOrders) {
                unsubOrders();
            }
            if (unsubStocks) {
                unsubStocks();
            }
            if (unsubNotifications) {
                unsubNotifications();
            }
        };
    }, [db, user, userProfile, activeRole, authLoading, restaurants, setOrders, setStocks, setNotifications, setIsLoading]);

    return <>{children}</>;
};

export const markNotificationRead = async (db: Firestore, notificationId: string) => {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: `notifications/${notificationId}`,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
};

export const deleteMenuItem = async (db: Firestore, itemId: string) => {
    const itemDocRef = doc(db, 'plats', itemId);

    try {
        await deleteDoc(itemDocRef);
        const { deleteCloudinaryImageAction } = await import('@/app/actions/cloudinary-actions');
        void deleteCloudinaryImageAction(`plats/${itemId}`);
    } catch (e) {
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
        const { deleteCloudinaryImageAction } = await import('@/app/actions/cloudinary-actions');
        void deleteCloudinaryImageAction(`restaurants/${restaurantId}`);
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
