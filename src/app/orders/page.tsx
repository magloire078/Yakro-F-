import { OrderHistoryItem } from "@/components/order-history-item";
import type { Order } from "@/lib/types";

const pastOrders: Order[] = [
    {
        id: 'order1',
        restaurantName: 'Le Pili Pili',
        date: '2024-07-21',
        total: 11000,
        status: 'Livrée',
        items: [
            { id: 'm1', name: 'Poulet Braisé', price: 7500, quantity: 1, description: 'Poulet entier grillé, mariné aux épices locales.', image: 'https://placehold.co/100x100', imageHint: 'grilled chicken' },
            { id: 'm3', name: 'Attiéké Poisson Thon', price: 3500, quantity: 1, description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', image: 'https://placehold.co/100x100', imageHint: 'attieke fried fish' },
        ]
    },
    {
        id: 'order2',
        restaurantName: 'Chez Mario',
        date: '2024-07-18',
        total: 6500,
        status: 'Livrée',
        items: [
            { id: 'm5', name: 'Alloco', price: 1500, quantity: 1, description: 'Bananes plantains mûres frites, un délice sucré-salé.', image: 'https://placehold.co/100x100', imageHint: 'fried plantain' },
            { id: 'm2', name: 'Foutou Banane, Sauce Graine', price: 5000, quantity: 1, description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', image: 'https://placehold.co/100x100', imageHint: 'fufu palm nut soup' },
        ]
    },
    {
        id: 'order3',
        restaurantName: 'La Brise du Lac',
        date: '2024-07-15',
        total: 6000,
        status: 'Annulée',
        items: [
            { id: 'm4', name: 'Kedjenou de Poulet', price: 6000, quantity: 1, description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', image: 'https://placehold.co/100x100', imageHint: 'chicken stew' },
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
