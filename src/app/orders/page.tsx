import { OrderHistoryItem } from "@/components/order-history-item";
import type { Order } from "@/lib/types";

const pastOrders: Order[] = [
    {
        id: 'order1',
        restaurantName: 'Le Pili Pili',
        date: '2024-05-18',
        total: 27.50,
        status: 'Livrée',
        items: [
            { id: 'm1', name: 'Poulet Braisé', price: 12.50, quantity: 1, description: '', image: 'https://placehold.co/100x100', imageHint: 'grilled chicken' },
            { id: 'm5', name: 'Attiéké Poisson', price: 15.00, quantity: 1, description: '', image: 'https://placehold.co/100x100', imageHint: 'african dish' },
        ]
    },
    {
        id: 'order2',
        restaurantName: 'Pizza Bella',
        date: '2024-05-15',
        total: 21.00,
        status: 'Livrée',
        items: [
            { id: 'm2', name: 'Pizza Margherita', price: 14.00, quantity: 1, description: '', image: 'https://placehold.co/100x100', imageHint: 'pizza' },
            { id: 'm6', name: 'Tiramisu', price: 7.00, quantity: 1, description: '', image: 'https://placehold.co/100x100', imageHint: 'tiramisu' },
        ]
    },
    {
        id: 'order3',
        restaurantName: 'Burger Queen',
        date: '2024-05-12',
        total: 9.50,
        status: 'Annulée',
        items: [
            { id: 'm4', name: 'Classic Cheeseburger', price: 9.50, quantity: 1, description: '', image: 'https://placehold.co/100x100', imageHint: 'cheeseburger' },
        ]
    }
];

export default function OrdersPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-4xl font-headline text-primary mb-8">Historique des commandes</h1>
            <div className="space-y-6">
                {pastOrders.map(order => (
                    <OrderHistoryItem key={order.id} order={order} />
                ))}
            </div>
        </div>
    )
}
