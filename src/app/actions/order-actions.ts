
'use server';

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    try {
        await addDoc(collection(db, "commandes"), order);
        revalidatePath('/'); // For customer home page status
        revalidatePath('/orders'); // For customer order history
        revalidatePath('/dashboard/orders'); // For restaurateur
    } catch (e) {
        console.error("Error adding order: ", e);
        throw new Error("Failed to add order.");
    }
}

export async function updateOrderStatusAction({ orderId, status, delivererId }: { orderId: string, status: Order['statut'], delivererId?: string }) {
    const orderDocRef = doc(db, 'commandes', orderId);
    try {
        const updateData: {statut: Order['statut'], livreurId?: string} = { statut: status };
        if (delivererId) {
            updateData.livreurId = delivererId;
        }
      await updateDoc(orderDocRef, updateData);
      revalidatePath('/');
      revalidatePath('/dashboard/orders');
    } catch (e) {
      console.error("Error updating order status: ", e);
      throw new Error("Failed to update order status.");
    }
}
