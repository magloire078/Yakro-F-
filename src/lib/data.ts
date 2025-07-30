
import type { MenuItem, Restaurant, Order } from './types';

// These are used for seeding the database on first run and for providing static data
// for features that don't require real-time updates.

export const pastOrders: Order[] = [
    
];

// Data for seeding the database if it's empty
export const initialRestaurants: Omit<Restaurant, 'id'>[] = [
    {
        ownerId: 'placeholderOwnerId1',
        name: 'Maquis du Val',
        cuisine: 'Ivoirienne',
        rating: 4.5,
        deliveryTime: 35,
        image: 'https://placehold.co/600x400.png',
        imageHint: 'maquis restaurant african',
        address: 'Quartier 2000, Yamoussoukro'
    },
    {
        ownerId: 'placeholderOwnerId2',
        name: 'Le Grand Large',
        cuisine: 'Française',
        rating: 4.8,
        deliveryTime: 45,
        image: 'https://placehold.co/600x400.png',
        imageHint: 'french bistro fine dining',
        address: 'Rue des Lacs, Yamoussoukro'
    },
    {
        ownerId: 'placeholderOwnerId3',
        name: 'Pizza Bella',
        cuisine: 'Pizzeria',
        rating: 4.2,
        deliveryTime: 30,
        image: 'https://placehold.co/600x400.png',
        imageHint: 'pizza oven italy',
        address: 'Centre-ville, près du marché'
    },
    {
        ownerId: 'placeholderOwnerId4',
        name: 'Le Régal d\'Afrique',
        cuisine: 'Grillades',
        rating: 4.6,
        deliveryTime: 40,
        image: 'https://placehold.co/600x400.png',
        imageHint: 'grilled chicken barbecue',
        address: 'Route de l\'aéroport, Yamoussoukro'
    },
    {
        ownerId: 'placeholderOwnerId5',
        name: 'La Pâtisserie Gourmande',
        cuisine: 'Pâtisserie',
        rating: 4.9,
        deliveryTime: 25,
        image: 'https://placehold.co/600x400.png',
        imageHint: 'french pastries cakes',
        address: 'Quartier Millionnaire, Yamoussoukro'
    }
];

export const initialMenuItems: Omit<MenuItem, 'id' | 'restaurantId'>[] = [
    // Maquis du Val
    {
        name: 'Poulet Braisé Complet',
        description: 'Un poulet entier mariné aux épices locales et braisé à la perfection, servi avec frites et salade.',
        price: 7500,
        imageHint: 'braised chicken ivorian',
        availableSides: [
            { name: 'Alloco', price: 500 },
            { name: 'Attiéké', price: 500 }
        ],
        availableDrinks: [
            { name: 'Coca-Cola', price: 500 },
            { name: 'Bissap', price: 500 }
        ]
    },
    {
        name: 'Poisson Braisé',
        description: 'Belle carpe braisée, accompagnée de sa sauce spéciale et d\'attiéké frais.',
        price: 6000,
        imageHint: 'grilled fish african food',
        availableSides: [
            { name: 'Frites de Patate Douce', price: 700 },
            { name: 'Riz Blanc', price: 300 }
        ],
        availableDrinks: [
            { name: 'Guinness', price: 1000 },
            { name: 'Eau Minérale', price: 500 }
        ]
    },
    // Le Grand Large
    {
        name: 'Filet de Boeuf et sa sauce au poivre',
        description: 'Tendre filet de bœuf poêlé, nappé d\'une onctueuse sauce au poivre vert, et accompagné de gratin dauphinois.',
        price: 12500,
        imageHint: 'beef fillet pepper sauce',
        availableDrinks: [
            { name: 'Verre de vin rouge', price: 2500 },
            { name: 'Perrier', price: 1000 }
        ]
    },
    {
        name: 'Salade Niçoise Revisitée',
        description: 'Une version gastronomique de la célèbre salade niçoise, avec du thon frais mi-cuit.',
        price: 8500,
        imageHint: 'nicoise salad gourmet'
    },
    // Pizza Bella
    {
        name: 'Pizza Reine',
        description: 'La classique et indémodable : sauce tomate, mozzarella, jambon, et champignons frais.',
        price: 5500,
        imageHint: 'regina pizza classic',
        availableDrinks: [
            { name: 'Fanta', price: 500 },
            { name: 'Bière locale', price: 1000 }
        ]
    },
    {
        name: 'Pizza 4 Saisons',
        description: 'Un quart de chaque saveur : artichauts, jambon, champignons, et poivrons.',
        price: 6500,
        imageHint: 'four seasons pizza'
    },
    // Le Régal d'Afrique
    {
        name: 'Brochettes de Mérou',
        description: 'Tendres cubes de mérou marinés et grillés, servis avec une sauce chien et de l\'alloco.',
        price: 7000,
        imageHint: 'fish skewers grilled'
    },
    {
        name: 'Agneau Diby',
        description: 'Fines tranches d\'agneau marinées à la sénégalaise et grillées, un délice !',
        price: 8000,
        imageHint: 'lamb diby african barbecue'
    },
    // La Pâtisserie Gourmande
    {
        name: 'Tarte au citron meringuée',
        description: 'Un équilibre parfait entre l\'acidité du citron et la douceur de la meringue italienne.',
        price: 2500,
        imageHint: 'lemon tart meringue'
    },
    {
        name: 'Mille-feuille',
        description: 'Pâte feuilletée croustillante et crème pâtissière légère à la vanille de Madagascar.',
        price: 3000,
        imageHint: 'mille feuille pastry'
    }
];
