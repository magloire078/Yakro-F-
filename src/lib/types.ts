
export interface MenuOption {
  nom: string;
  prix: number;
}

export type DietaryTag = 'halal' | 'vegetarien' | 'vegan' | 'sans-gluten' | 'sans-porc' | 'epice';

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
  /** Tags diététiques. Permet aux clients de filtrer par préférence/restriction. */
  tagsDiet?: DietaryTag[];
  /** Si true, le plat est en rupture / temporairement indisponible. Masqué côté client. */
  indisponible?: boolean;
}

export type DayOfWeek = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

export interface DailyHours {
  ferme: boolean;
  ouverture: string; // "HH:mm"
  fermeture: string; // "HH:mm"
}

export type WeeklyHours = Record<DayOfWeek, DailyHours>;

export interface HappyHour {
  /** Pourcentage de réduction sur tous les plats (1-50). */
  pourcentage: number;
  /** Heure de début "HH:mm". */
  debut: string;
  /** Heure de fin "HH:mm". Si fin < debut, période enjambe minuit. */
  fin: string;
  /** Si défini, restreint aux jours indiqués. Sinon, tous les jours. */
  jours?: DayOfWeek[];
  /** Activation / désactivation rapide sans tout effacer. */
  actif: boolean;
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
  horaires?: WeeklyHours;
  fermetureTemporaire?: boolean;
  /** Promotion happy hour active sur ce restaurant. */
  happyHour?: HappyHour;
  /** ID du plat mis en avant comme "Plat du jour". */
  platDuJourId?: string;
}

export interface CartItem extends Omit<MenuItem, 'image'> {
  quantite: number;
  image?: string;
  accompagnementSelectionne?: MenuOption;
  boissonSelectionnee?: MenuOption;
}

export type PaymentMethod = 'especes' | 'wave' | 'orange-money' | 'mtn-momo' | 'carte';

export type PaymentStatus = 'A la livraison' | 'En attente' | 'Confirmé' | 'Échoué';

export type IncidentType =
  | 'adresse-introuvable'
  | 'client-absent'
  | 'plat-manquant'
  | 'commande-incomplete'
  | 'plat-froid'
  | 'autre';

export type IncidentReporter = 'client' | 'livreur' | 'restaurateur';

export interface OrderIncident {
  id: string;
  type: IncidentType;
  message?: string;
  signalePar: IncidentReporter;
  date: string; // ISO
}

export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed' | 'freeDelivery';
  valeur: number; // pourcentage (ex: 10 pour 10%) ou montant en FCFA
  minimumCommande?: number;
  description: string;
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
  codePromo?: string;
  reductionPromo?: number;
  /** ISO datetime; absent = livraison immédiate */
  programmePour?: string;

  /** Mode de paiement choisi par le client. */
  methodePaiement?: PaymentMethod;
  /** Statut du paiement. "A la livraison" = paiement en espèces au livreur. */
  statutPaiement?: PaymentStatus;
  /** Numéro de téléphone Mobile Money (sans indicatif) ou 4 derniers chiffres carte. */
  referencePaiement?: string;
  /** Points de fidélité gagnés sur cette commande (calculés à la création). */
  pointsGagnes?: number;
  /** Notes / instructions de livraison saisies par le client (allergies, étage, code, etc.). */
  instructionsLivraison?: string;
  /** Libellé de l'adresse choisie au moment de la commande (Maison, Travail, etc.). */
  libelleAdresse?: string;
  /** Incidents signalés sur la commande (adresse introuvable, plat manquant…). */
  incidents?: OrderIncident[];
  /** Motif libre saisi à l'annulation. */
  motifAnnulation?: string;
  /** Réduction parrainage appliquée au filleul sur cette commande. */
  reductionParrainage?: number;
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
  /** UID de l'auteur (absent pour les avis générés par IA). */
  userId?: string;
  nomUtilisateur:string;
  note: number;
  commentaire: string;
  /** ISO datetime de création. */
  date?: string;
  /** URL d'une photo jointe (Firebase Storage). */
  imageUrl?: string;
}

export type ChatRole = 'client' | 'livreur';

export interface ChatMessage {
  id: string;
  fromUid: string;
  fromRole: ChatRole;
  text: string;
  date: string; // ISO
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

export interface SavedAddress {
  id: string;
  libelle: string; // "Maison", "Travail", "Chez Maman", etc.
  adresse: string;
  latitude?: number;
  longitude?: number;
  parDefaut?: boolean;
}

export interface Parrainage {
  id: string;
  /** Code snapshot du parrain ; le parrain l'utilise pour requêter ses bonus. */
  parrainCode: string;
  /** Filleul qui a déclenché le bonus (et créé le doc). */
  filleulUid: string;
  /** Points de fidélité crédités au parrain. */
  pointsBonus: number;
  date: string; // ISO
}

export interface UserProfile {
    uid: string;
    email: string;
    dateCreation: any; // Firestore Timestamp
    nom?: string;
    telephone?: string;
    adresseParDefaut?: string;

    /** Adresses enregistrées de l'utilisateur (Maison, Travail, etc.). */
    adresses?: SavedAddress[];

    /** Code de parrainage unique de l'utilisateur (à partager avec ses amis). */
    codeParrainage?: string;
    /** Code saisi par le filleul à l'inscription (immutable une fois posé). */
    parraineParCode?: string;
    /** True une fois que la réduction de parrainage a été utilisée. */
    bonusParrainageUtilise?: boolean;

    // Le rôle fonctionnel unique de l'utilisateur.
    role: AppRole;

    // Le niveau de permissions de l'utilisateur dans le système.
    roleSysteme?: SystemRole;

    statutService?: 'En service' | 'Hors service';

    // Position actuelle du livreur
    latitude?: number;
    longitude?: number;

    // Restaurants favoris (IDs)
    favorisRestaurants?: string[];
}
