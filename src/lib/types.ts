

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
  latitude?: number;
  longitude?: number;
}

export interface CartItem extends Omit<MenuItem, 'image'> {
  quantite: number;
  image?: string;
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
  latitudeClient?: number;
  longitudeClient?: number;
  latitudeRestaurant?: number;
  longitudeRestaurant?: number;
}

export interface Review {
  id: string;
  restaurantId: string;
  nomUtilisateur:string;
  note: number;
  commentaire: string;
}

/**
 * @description
 * AppRole définit les capacités fonctionnelles (le "chapeau") qu'un utilisateur peut avoir.
 * Un utilisateur a désormais un et un seul rôle.
 */
export type AppRole = 'client' | 'restaurateur' | 'livreur';

/**
 * @description
 * SystemRole définit le niveau d'autorité de l'utilisateur dans la hiérarchie du système.
 * Ce rôle est généralement attribué par un administrateur et n'est pas modifiable par l'utilisateur.
 * Il contrôle l'accès aux fonctionnalités d'administration backend.
 *
 * Ex: Seul un 'SuperAdmin' peut voir la liste de tous les utilisateurs.
 */
export type SystemRole = 'SuperAdmin' | 'Admin' | 'User';

export interface UserProfile {
    uid: string;
    email: string;
    dateCreation: any; // Firestore Timestamp
    nom?: string;
    telephone?: string;
    adresseParDefaut?: string;
    
    // Le rôle fonctionnel unique de l'utilisateur.
    role: AppRole;
    
    // Le niveau de permissions de l'utilisateur dans le système.
    roleSysteme?: SystemRole;
    
    statutService?: 'En service' | 'Hors service';
    
    // Position actuelle du livreur
    latitude?: number;
    longitude?: number;
}
