
'use server';

import { collection, addDoc, updateDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    const docRef = doc(collection(db, "commandes"));
    
    setDoc(docRef, order)
      .then(() => {
        revalidatePath('/'); // For customer home page status
        revalidatePath('/orders'); // For customer order history
        revalidatePath('/dashboard/orders'); // For restaurateur
      })
      .catch((e) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: order,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error adding order: ", e);
        // We still throw to let the client know something went wrong.
        throw new Error("Failed to add order.");
    });
}

export async function updateOrderStatusAction({ orderId, status, delivererId }: { orderId: string, status: Order['statut'], delivererId?: string }) {
    const orderDocRef = doc(db, 'commandes', orderId);
    const updateData: {statut: Order['statut'], livreurId?: string} = { statut: status };
    if (delivererId) {
        updateData.livreurId = delivererId;
    }
    
    updateDoc(orderDocRef, updateData)
      .then(() => {
        revalidatePath('/');
        revalidatePath('/dashboard/orders');
        revalidatePath('/auth/livreur');
        revalidatePath('/dashboard/earnings');
      })
      .catch((e) => {
        const permissionError = new FirestorePermissionError({
              path: orderDocRef.path,
              operation: 'update',
              requestResourceData: updateData,
          });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error updating order status: ", e);
        // We still throw to let the client know something went wrong.
        throw new Error("Failed to update order status.");
    });
}
