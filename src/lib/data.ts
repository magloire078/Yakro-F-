
import type { MenuItem, Restaurant, Order } from './types';

// These are used for seeding the database on first run and for providing static data
// for features that don't require real-time updates.

export const pastOrders: Order[] = [
    
];

// Data for seeding the database if it's empty
export const initialRestaurants: Omit<Restaurant, 'id'>[] = [
    
];

export const initialMenuItems: Omit<MenuItem, 'id' | 'restaurantId'>[] = [
    
];
