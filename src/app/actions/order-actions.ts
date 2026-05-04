// Client-side helpers for /commandes mutations.
// Despite living under `app/actions/`, these run in the browser using the
// Firebase client SDK and rely on Firestore security rules for enforcement.

import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Order } from '@/lib/types';
import { decrementStockForOrder } from '@/lib/stock-utils';

export async function updateOrderStatusAction({
    orderId,
    status,
    delivererId,
    orderData
}: {
    orderId: string,
    status: Order['statut'],
    delivererId?: string,
    orderData?: Order
}) {
    const orderDocRef = doc(db!, 'commandes', orderId);
    const updateData: { statut: Order['statut'], livreurId?: string } = { statut: status };
    if (delivererId) {
        updateData.livreurId = delivererId;
    }

    try {
        await updateDoc(orderDocRef, updateData);

        if (status === 'Livrée') {
            let fullOrder = orderData;

            if (!fullOrder) {
                const snap = await getDoc(orderDocRef);
                if (snap.exists()) {
                    fullOrder = { id: snap.id, ...snap.data() } as Order;
                }
            }

            if (fullOrder) {
                await decrementStockForOrder(db!, fullOrder);
            }
        }
    } catch (e: unknown) {
        console.error("Error updating order status: ", e);
        throw e;
    }
}
