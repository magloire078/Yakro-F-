
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageHint: string;
  restaurantId: string;
  availableSides?: string[];
  availableDrinks?: string[];
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
  selectedSide?: string;
  selectedDrink?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
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

export interface UserProfile {
    uid: string;
    email: string;
    createdAt: any; // Firestore Timestamp
    name?: string;
    phone?: string;
    defaultAddress?: string;
}

export type UserRole = 'client' | 'restaurateur' | 'livreur';
