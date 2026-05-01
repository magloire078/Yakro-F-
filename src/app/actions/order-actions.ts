import { collection, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Order } from '@/lib/types';
import { decrementStockForOrder } from '@/lib/stock-utils';

export async function addOrderAction(order: Omit<Order, 'id'>) {
    const docRef = doc(collection(db!, "commandes"));

    try {
        await setDoc(docRef, order);
        // revalidatePath removed for static export
    } catch (e: unknown) {
        console.error("Error adding order: ", e);
        throw e;
    }
}

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

        // Si la commande est livrée, on déclenche la déduction de stock
        if (status === 'Livrée') {
            let fullOrder = orderData;
            
            // Si on n'a pas les données de la commande, on les récupère
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
