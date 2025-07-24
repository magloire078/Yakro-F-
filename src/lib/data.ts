import type { MenuItem, Restaurant, Order } from './types';

export const initialRestaurants: Restaurant[] = [
    { id: '1', name: 'Le Pili Pili', cuisine: 'Ivoirienne', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/600x400', imageHint: 'african food' },
    { id: '2', name: 'Chez Mario', cuisine: 'Pizza', rating: 4.7, deliveryTime: 35, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
    { id: '3', name: 'Le Bazin', cuisine: 'Africaine', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'traditional african food' },
    { id: '4', name: 'La Brise du Lac', cuisine: 'Grillades', rating: 4.5, deliveryTime: 40, image: 'https://placehold.co/600x400', imageHint: 'lake view' },
];

export const initialMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Poulet Braisé', description: 'Poulet entier grillé, mariné aux épices locales.', price: 7500, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken', restaurantId: '1' },
    { id: 'm2', name: 'Foutou Banane, Sauce Graine', description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', price: 5000, image: 'https://placehold.co/600x400', imageHint: 'fufu palm nut soup', restaurantId: '3' },
    { id: 'm3', name: 'Attiéké Poisson Thon', description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', price: 3500, image: 'https://placehold.co/600x400', imageHint: 'attieke fried fish', restaurantId: '1' },
    { id: 'm4', name: 'Kedjenou de Poulet', description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', price: 6000, image: 'https://placehold.co/600x400', imageHint: 'chicken stew', restaurantId: '4' },
    { id: 'm5', name: 'Alloco', description: 'Bananes plantains mûres frites, un délice sucré-salé.', price: 1500, image: 'https://placehold.co/600x400', imageHint: 'fried plantain', restaurantId: '3' },
    { id: 'm6', name: 'Pizza Reine', description: 'Pizza garnie de jambon, champignons et fromage.', price: 8000, image: 'https://placehold.co/600x400', imageHint: 'pizza', restaurantId: '2' },
    { id: 'm7', name: 'Pizza 4 Saisons', description: 'Pizza végétarienne avec artichauts, poivrons, olives et champignons.', price: 8500, image: 'https://placehold.co/600x400', imageHint: 'vegetarian pizza', restaurantId: '2' },
    { id: 'm8', name: 'Brochettes de Boeuf', description: 'Tendres morceaux de boeuf marinés et grillés.', price: 4000, image: 'https://placehold.co/600x400', imageHint: 'beef skewers', restaurantId: '4' },
];

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