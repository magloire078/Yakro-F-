

export interface MenuOption {
  nom: string;
  prix: number;
}

export interface MenuItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
  image?: string; // URL de l'image stockée
  indiceImage: string;
  restaurantId: string;
  accompagnementsDisponibles?: MenuOption[];
  boissonsDisponibles?: MenuOption[];
}

export interface Restaurant {
  id: string;
  proprietaireId: string;
  nom: string;
  cuisine: string;
  note: number;
  tempsDeLivraison: number;
  fraisDeLivraison: number;
  image: string;
  indiceImage: string;
  adresse?: string;
  enVedette?: boolean;
}

export interface CartItem extends MenuItem {
  quantite: number;
  image: string; // Garde une URL pour l'affichage, même si c'est un placeholder
  accompagnementSelectionne?: MenuOption;
  boissonSelectionnee?: MenuOption;
}

export interface Order {
  id: string;
  userId: string;
  plats: CartItem[];
  sousTotal: number;
  fraisDeLivraison: number;
  total: number;
  tauxCommission: number;
  montantCommission: number;
  revenuNet: number;
  date: string;
  nomRestaurant: string;
  restaurantId: string;
  statut: 'Placée' | 'En Préparation' | 'En Route' | 'Livrée' | 'Annulée';
  livreurId?: string;
  adresseClient: string;
  adresseRestaurant: string;
  telephoneClient: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  nomUtilisateur:string;
  note: number;
  commentaire: string;
}

// AppRole defines the functional capabilities a user can have.
// A user can switch between these roles if they have the rights.
export type AppRole = 'client' | 'restaurateur' | 'livreur';

// SystemRole defines the user's position in the system hierarchy.
// This is typically assigned by an admin and is not user-switchable.
export type SystemRole = 'SuperAdmin' | 'Admin' | 'User';

export interface UserProfile {
    uid: string;
    email: string;
    dateCreation: any; // Firestore Timestamp
    nom?: string;
    telephone?: string;
    adresseParDefaut?: string;
    // This is the functional role the user is currently using
    role?: AppRole;
    // This is the user's system-level permissions
    roleSysteme?: SystemRole;
    // The functional roles this user is allowed to access
    rolesAutorises?: AppRole[];
}
