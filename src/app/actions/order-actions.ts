'use server';

import { collection, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    const docRef = doc(collection(db, "commandes"));
    
    try {
        await setDoc(docRef, order);
        revalidatePath('/');
        revalidatePath('/orders');
        revalidatePath('/dashboard/orders');
    } catch (e: any) {
        console.error("Error adding order: ", e);
        throw e;
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
        console.error("Error updating order status: ", e);
        throw e;
    }
}
