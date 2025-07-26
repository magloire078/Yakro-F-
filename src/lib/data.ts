
import type { MenuItem, Restaurant, Order } from './types';

// These are used for seeding the database on first run and for providing static data
// for features that don't require real-time updates.

export const pastOrders: Order[] = [
    {
        id: 'order1',
        userId: 'user1',
        restaurantName: 'Le Pili Pili',
        restaurantId: '1',
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
        userId: 'user1',
        restaurantName: 'Le Bazin',
        restaurantId: '3',
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
        userId: 'user1',
        restaurantName: 'La Brise du Lac',
        restaurantId: '4',
        date: '2024-07-15',
        total: 6000,
        status: 'Annulée',
        items: [
            { id: 'm4', name: 'Kedjenou de Poulet', price: 6000, quantity: 1, description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', image: 'https://placehold.co/100x100', imageHint: 'chicken stew', restaurantId: '4' },
        ]
    }
];

// Data for seeding the database if it's empty
export const initialRestaurants: Omit<Restaurant, 'id'>[] = [
    { name: 'Le Pili Pili', cuisine: 'Ivoirienne', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/600x400', imageHint: 'african food' },
    { name: 'Chez Oklou', cuisine: 'Togolaise', rating: 4.6, deliveryTime: 35, image: 'https://placehold.co/600x400', imageHint: 'togolese food' },
    { name: 'Le Bazin', cuisine: 'Africaine', rating: 4.5, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'african basin' },
    { name: 'La Brise du Lac', cuisine: 'Européenne', rating: 4.7, deliveryTime: 40, image: 'https://placehold.co/600x400', imageHint: 'lake view' },
    { name: 'Pizza Doudou', cuisine: 'Pizzeria', rating: 4.3, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'pizza delivery' }
];

export const initialMenuItems: Omit<MenuItem, 'id' | 'restaurantId'>[] = [
    { name: 'Poulet Braisé', description: 'Poulet entier grillé, mariné aux épices locales.', price: 7500, image: 'https://placehold.co/400x400', imageHint: 'grilled chicken' },
    { name: 'Foutou Banane, Sauce Graine', description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', price: 5000, image: 'https://placehold.co/400x400', imageHint: 'fufu palm nut soup' },
    { name: 'Attiéké Poisson Thon', description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', price: 3500, image: 'https://placehold.co/400x400', imageHint: 'attieke fried fish' },
    { name: 'Kedjenou de Poulet', description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', price: 6000, image: 'https://placehold.co/400x400', imageHint: 'chicken stew' },
    { name: 'Alloco', description: 'Bananes plantains mûres frites, un délice sucré-salé.', price: 1500, image: 'https://placehold.co/400x400', imageHint: 'fried plantain' },
    { name: 'Pizza Reine', description: 'La classique : Jambon, champignons, fromage.', price: 5500, image: 'https://placehold.co/400x400', imageHint: 'regina pizza' }
];
