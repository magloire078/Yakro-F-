// Client-side helper for /commandes mutations.
// Despite living under `app/actions/`, this runs in the browser using the
// Firebase client SDK, gated by the security rules. The privileged
// stock-decrement + low-stock notification path is delegated to the real
// server action `processDeliveredOrderAction` in `stock-actions.ts`.

import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/firebase/client';
import type { Order } from '@/lib/types';
import { processDeliveredOrderAction } from '@/app/actions/stock-actions';

export async function updateOrderStatusAction({
    orderId,
    status,
    delivererId,
}: {
    orderId: string,
    status: Order['statut'],
    delivererId?: string,
    /** kept for backwards compatibility with existing callers */
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
            const idToken = await auth?.currentUser?.getIdToken();
            if (!idToken) {
                console.error('updateOrderStatusAction: missing ID token, skipping stock sync');
                return;
            }
            const result = await processDeliveredOrderAction(orderId, idToken);
            if (!result.success) {
                console.error('processDeliveredOrderAction failed:', result.error);
            }
        }
    } catch (e: unknown) {
        console.error('Error updating order status:', e);
        throw e;
    }
}
