

export interface MenuOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string; // URL de l'image stockée
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
  deliveryFee: number;
  image: string;
  imageHint: string;
  address?: string;
  isFeatured?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  image: string; // Garde une URL pour l'affichage, même si c'est un placeholder
  selectedSide?: MenuOption;
  selectedDrink?: MenuOption;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
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
