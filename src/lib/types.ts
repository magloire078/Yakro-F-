
export interface MenuOption {
  nom: string;
  prix: number;
}

export interface MenuItemIngredient {
  stockItemId: string;
  nom: string;
  quantite: number;
  unite: string;
}

export interface MenuItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string; // Entrée, Plat, Dessert, Boisson, etc.
  image?: string; // URL de l'image stockée
  indiceImage: string;
  restaurantId: string;
  accompagnementsDisponibles?: MenuOption[];
  boissonsDisponibles?: MenuOption[];
  ingredients?: MenuItemIngredient[];
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
  suspendu?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CartItem extends Omit<MenuItem, 'image'> {
  quantite: number;
  image?: string;
  accompagnementSelectionne?: MenuOption;
  boissonSelectionnee?: MenuOption;
}

export type PaymentMode = 'especes' | 'orange_money' | 'mtn_money' | 'moov_money';
export type PaymentStatus = 'a_la_livraison' | 'en_attente' | 'paye' | 'echoue';

export interface OrderPayment {
  mode: PaymentMode;
  statut: PaymentStatus;
  montant: number;
  transactionId?: string;
  paymentToken?: string;
  dateConfirmation?: string;
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
  restaurateurId: string;
  statut: 'Placée' | 'En Préparation' | 'Prête' | 'En Route' | 'Livrée' | 'Annulée';
  livreurId?: string;
  paiement: OrderPayment;
  adresseClient: string;
  adresseRestaurant: string;
  telephoneClient: string;
  latitudeClient?: number;
  longitudeClient?: number;
  latitudeRestaurant?: number;
  longitudeRestaurant?: number;
  /**
   * Verrou d'idempotence posé par processDeliveredOrderAction (décompte de
   * stock + crédit de points de fidélité/parrainage) : empêche un double
   * traitement si l'action est rappelée pour la même commande.
   */
  livraisonTraitee?: boolean;
}

export interface Review {
  id: string;
  restaurantId: string;
  /** Client auteur de l'avis — doit correspondre à orderId.userId. */
  userId: string;
  /** Commande livrée qui autorise cet avis ; sert aussi d'id du document
   * (un seul avis par commande, imposé par les règles Firestore). */
  orderId: string;
  nomUtilisateur: string;
  note: number;
  commentaire: string;
  date: string;
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

import { Timestamp, FieldValue } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  dateCreation: Timestamp | FieldValue; // Firestore Timestamp or serverTimestamp()
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

  /**
   * Points de fidélité (1000 FCFA commandés = 10 points). Crédités
   * uniquement par le SDK Admin (processDeliveredOrderAction) à la
   * livraison confirmée — jamais modifiables par le client lui-même.
   */
  pointsFidelite?: number;

  /**
   * uid du parrain, capturé une seule fois à la création du profil (lien
   * ou code de parrainage = l'uid du parrain). Immuable après création.
   */
  parrainId?: string;

  /**
   * Passe à true dès que le parrain a été crédité de son bonus de
   * parrainage (à la première commande livrée du filleul), pour ne
   * jamais créditer deux fois. Modifiable uniquement par le SDK Admin.
   */
  filleulRecompenseVersee?: boolean;
}

export interface StockItem {
  id: string;
  restaurantId: string;
  restaurateurId: string;
  nom: string;
  quantite: number;
  unite: string; // kg, g, l, ml, unités, caisses
  seuilAlerte: number;
  derniereMiseAJour: string;
}

export type NotificationType = 'STOCK_LOW' | 'NEW_ORDER' | 'ORDER_OVERDUE';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  read: boolean;
  date?: Timestamp | FieldValue;
  // STOCK_LOW payload
  stockItemId?: string;
  stockItemNom?: string;
  quantiteRestante?: number;
  seuilAlerte?: number;
  restaurantId?: string;
  // NEW_ORDER / ORDER_OVERDUE payload
  orderId?: string;
  total?: number;
  ageMinutes?: number;
}

