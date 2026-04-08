// Refactored for static export

import { collection, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Order } from '@/lib/types';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    const docRef = doc(collection(db, "commandes"));

    try {
        await setDoc(docRef, order);
        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error adding order: ", e);
        throw e;
    }
}

export async function updateOrderStatusAction({ orderId, status, delivererId }: { orderId: string, status: Order['statut'], delivererId?: string }) {
    const orderDocRef = doc(db, 'commandes', orderId);
    const updateData: { statut: Order['statut'], livreurId?: string } = { statut: status };
    if (delivererId) {
        updateData.livreurId = delivererId;
    }

    try {
        await updateDoc(orderDocRef, updateData);
        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error updating order status: ", e);
        throw e;
    }
}
