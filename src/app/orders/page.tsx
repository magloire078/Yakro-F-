

import { OrderHistoryItem } from "@/components/order-history-item";
import { pastOrders } from "@/lib/data";


export default function OrdersPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-4xl font-headline text-primary mb-8">Historique des commandes</h1>
            <div className="space-y-6">
                {pastOrders.map(order => (
                    <OrderHistoryItem key={order.id} order={order} />
                ))}
            </div>
        </div>
    )
}
