

export interface MenuOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageHint: string;
  restaurantId: string;
  availableSides?: MenuOption[];
  availableDrinks?: MenuOption[];
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: number;
  image: string;
  imageHint: string;
  address?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  image: string; // Keep for cart display logic
  selectedSide?: MenuOption;
  selectedDrink?: MenuOption;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  commissionRate: number;
  commissionAmount: number;
  netRevenue: number;
  date: string;
  restaurantName: string;
  restaurantId: string;
  status: 'Placée' | 'En Préparation' | 'En Route' | 'Livrée' | 'Annulée';
  delivererId?: string;
  customerAddress: string;
  restaurantAddress: string;
  customerPhone: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  userName:string;
  rating: number;
  comment: string;
}

export type UserRole = 'client' | 'restaurateur' | 'livreur';

export interface UserProfile {
    uid: string;
    email: string;
    createdAt: any; // Firestore Timestamp
    name?: string;
    phone?: string;
    defaultAddress?: string;
    role?: UserRole;
}
