
import type { MenuItem, Restaurant, Order } from './types';

// These are used for seeding the database on first run and for providing static data
// for features that don't require real-time updates.

export const pastOrders: Order[] = [
    
];

// Data for seeding the database if it's empty
export const initialRestaurants: Omit<Restaurant, 'id'>[] = [
    {
        proprietaireId: 'placeholderOwnerId1',
        nom: 'Maquis du Val',
        cuisine: 'Ivoirienne',
        note: 4.5,
        tempsDeLivraison: 35,
        fraisDeLivraison: 1000,
        image: '',
        indiceImage: 'maquis restaurant african',
        adresse: 'Quartier 2000, Yamoussoukro'
    },
    {
        proprietaireId: 'placeholderOwnerId2',
        nom: 'Le Grand Large',
        cuisine: 'Française',
        note: 4.8,
        tempsDeLivraison: 45,
        fraisDeLivraison: 1500,
        image: '',
        indiceImage: 'french bistro fine dining',
        adresse: 'Rue des Lacs, Yamoussoukro'
    },
    {
        proprietaireId: 'placeholderOwnerId3',
        nom: 'Pizza Bella',
        cuisine: 'Pizzeria',
        note: 4.2,
        tempsDeLivraison: 30,
        fraisDeLivraison: 500,
        image: '',
        indiceImage: 'pizza oven italy',
        adresse: 'Centre-ville, près du marché'
    },
    {
        proprietaireId: 'placeholderOwnerId4',
        nom: 'Le Régal d\'Afrique',
        cuisine: 'Grillades',
        note: 4.6,
        tempsDeLivraison: 40,
        fraisDeLivraison: 1000,
        image: '',
        indiceImage: 'grilled chicken barbecue',
        adresse: 'Route de l\'aéroport, Yamoussoukro'
    },
    {
        proprietaireId: 'placeholderOwnerId5',
        nom: 'La Pâtisserie Gourmande',
        cuisine: 'Pâtisserie',
        note: 4.9,
        tempsDeLivraison: 25,
        fraisDeLivraison: 500,
        image: '',
        indiceImage: 'french pastries cakes',
        adresse: 'Quartier Millionnaire, Yamoussoukro'
    }
];

export const initialMenuItems: Omit<MenuItem, 'id' | 'restaurantId'>[] = [
    // Maquis du Val
    {
        nom: 'Poulet Braisé Complet',
        description: 'Un poulet entier mariné aux épices locales et braisé à la perfection, servi avec frites et salade.',
        prix: 7500,
        indiceImage: 'braised chicken ivorian',
        accompagnementsDisponibles: [
            { nom: 'Alloco', prix: 500 },
            { nom: 'Attiéké', prix: 500 }
        ],
        boissonsDisponibles: [
            { nom: 'Coca-Cola', prix: 500 },
            { nom: 'Bissap', prix: 500 }
        ]
    },
    {
        nom: 'Poisson Braisé',
        description: 'Belle carpe braisée, accompagnée de sa sauce spéciale et d\'attiéké frais.',
        prix: 6000,
        indiceImage: 'grilled fish african food',
        accompagnementsDisponibles: [
            { nom: 'Frites de Patate Douce', prix: 700 },
            { nom: 'Riz Blanc', prix: 300 }
        ],
        boissonsDisponibles: [
            { nom: 'Guinness', prix: 1000 },
            { nom: 'Eau Minérale', prix: 500 }
        ]
    },
    // Le Grand Large
    {
        nom: 'Filet de Boeuf et sa sauce au poivre',
        description: 'Tendre filet de bœuf poêlé, nappé d\'une onctueuse sauce au poivre vert, et accompagné de gratin dauphinois.',
        prix: 12500,
        indiceImage: 'beef fillet pepper sauce',
        boissonsDisponibles: [
            { nom: 'Verre de vin rouge', prix: 2500 },
            { nom: 'Perrier', prix: 1000 }
        ]
    },
    {
        nom: 'Salade Niçoise Revisitée',
        description: 'Une version gastronomique de la célèbre salade niçoise, avec du thon frais mi-cuit.',
        prix: 8500,
        indiceImage: 'nicoise salad gourmet'
    },
    // Pizza Bella
    {
        nom: 'Pizza Reine',
        description: 'La classique et indémodable : sauce tomate, mozzarella, jambon, et champignons frais.',
        prix: 5500,
        indiceImage: 'regina pizza classic',
        boissonsDisponibles: [
            { nom: 'Fanta', prix: 500 },
            { nom: 'Bière locale', prix: 1000 }
        ]
    },
    {
        nom: 'Pizza 4 Saisons',
        description: 'Un quart de chaque saveur : artichauts, jambon, champignons, et poivrons.',
        prix: 6500,
        indiceImage: 'four seasons pizza'
    },
    // Le Régal d'Afrique
    {
        nom: 'Brochettes de Mérou',
        description: 'Tendres cubes de mérou marinés et grillés, servis avec une sauce chien et de l\'alloco.',
        prix: 7000,
        indiceImage: 'fish skewers grilled'
    },
    {
        nom: 'Agneau Diby',
        description: 'Fines tranches d\'agneau marinées à la sénégalaise et grillées, un délice !',
        prix: 8000,
        indiceImage: 'lamb diby african barbecue'
    },
    // La Pâtisserie Gourmande
    {
        nom: 'Tarte au citron meringuée',
        description: 'Un équilibre parfait entre l\'acidité du citron et la douceur de la meringue italienne.',
        prix: 2500,
        indiceImage: 'lemon tart meringue'
    },
    {
        nom: 'Mille-feuille',
        description: 'Pâte feuilletée croustillante et crème pâtissière légère à la vanille de Madagascar.',
        prix: 3000,
        indiceImage: 'mille feuille pastry'
    }
];
