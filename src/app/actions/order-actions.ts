
'use server';

import { collection, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    const docRef = doc(collection(db, "commandes"));
    
    try {
        await setDoc(docRef, order);
        revalidatePath('/'); // For customer home page status
        revalidatePath('/orders'); // For customer order history
        revalidatePath('/dashboard/orders'); // For restaurateur
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: 'commandes',
            operation: 'create',
            requestResourceData: order,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error adding order: ", e);
        throw e; // Re-throw the original error
    }
}

export async function updateOrderStatusAction({ orderId, status, delivererId }: { orderId: string, status: Order['statut'], delivererId?: string }) {
    const orderDocRef = doc(db, 'commandes', orderId);
    const updateData: {statut: Order['statut'], livreurId?: string} = { statut: status };
    if (delivererId) {
        updateData.livreurId = delivererId;
    }
    
    try {
        await updateDoc(orderDocRef, updateData);
        revalidatePath('/');
        revalidatePath('/dashboard/orders');
        revalidatePath('/auth/livreur');
        revalidatePath('/dashboard/earnings');
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
              path: orderDocRef.path,
              operation: 'update',
              requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error updating order status: ", e);
        throw e; // Re-throw the original error
    }
}
