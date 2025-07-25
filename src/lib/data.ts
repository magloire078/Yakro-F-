import type { MenuItem, Restaurant, Order } from './types';

// These are now legacy and only used for type reference or specific non-core features.
// The primary data is now fetched directly from Firestore.

export const pastOrders: Order[] = [
    {
        id: 'order1',
        restaurantName: 'Le Pili Pili',
        date: '2024-07-21',
        total: 11000,
        status: 'Livrée',
        items: [
            { id: 'm1', name: 'Poulet Braisé', price: 7500, quantity: 1, description: 'Poulet entier grillé, mariné aux épices locales.', image: 'https://placehold.co/100x100', imageHint: 'grilled chicken', restaurantId: '1' },
            { id: 'm3', name: 'Attiéké Poisson Thon', price: 3500, quantity: 1, description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', image: 'https://placehold.co/100x100', imageHint: 'attieke fried fish', restaurantId: '1' },
        ]
    },
    {
        id: 'order2',
        restaurantName: 'Le Bazin',
        date: '2024-07-18',
        total: 6500,
        status: 'Livrée',
        items: [
            { id: 'm5', name: 'Alloco', price: 1500, quantity: 1, description: 'Bananes plantains mûres frites, un délice sucré-salé.', image: 'https://placehold.co/100x100', imageHint: 'fried plantain', restaurantId: '3' },
            { id: 'm2', name: 'Foutou Banane, Sauce Graine', price: 5000, quantity: 1, description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', image: 'https://placehold.co/100x100', imageHint: 'fufu palm nut soup', restaurantId: '3' },
        ]
    },
    {
        id: 'order3',
        restaurantName: 'La Brise du Lac',
        date: '2024-07-15',
        total: 6000,
        status: 'Annulée',
        items: [
            { id: 'm4', name: 'Kedjenou de Poulet', price: 6000, quantity: 1, description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', image: 'https://placehold.co/100x100', imageHint: 'chicken stew', restaurantId: '4' },
        ]
    }
];

// Deprecated: These arrays are no longer used for initial data.
// The app now fetches directly from Firestore.
export const initialRestaurants: Restaurant[] = [];
export const initialMenuItems: MenuItem[] = [];
