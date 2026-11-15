/**
 * Données de démonstration du prototype mobile « Yakro Elite ».
 *
 * Volontairement statiques : le prototype de design doit rester visualisable
 * sans Firebase, sans compte et sans réseau Firestore. Les écrans réels
 * réutilisent les mêmes composants de présentation avec les données du
 * `DataContext`.
 */

export interface DemoRestaurant {
  id: string;
  nom: string;
  cuisine: string;
  note: number;
  avis: number;
  temps: string;
  frais: string;
  image: string;
  distance?: string;
  badge?: string;
}

export interface DemoDish {
  id: string;
  nom: string;
  description: string;
  prix: number;
  image: string;
  badge?: string;
  categorie: string;
}

export interface DemoCartLine {
  id: string;
  nom: string;
  options: string;
  prix: number;
  quantite: number;
  image: string;
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const DEMO = {
  utilisateur: {
    prenom: 'Kouadio',
    quartier: 'Quartier 2000',
    ville: 'Yamoussoukro',
    avatar: u('photo-1500648767791-00dcc994a43e'),
  },

  categories: [
    { id: 'tout', label: 'Tout', icone: '✨' },
    { id: 'ivoirien', label: 'Ivoirien', icone: '🍲' },
    { id: 'grillades', label: 'Grillades', icone: '🔥' },
    { id: 'pizza', label: 'Pizza', icone: '🍕' },
    { id: 'boissons', label: 'Boissons', icone: '🥤' },
    { id: 'desserts', label: 'Desserts', icone: '🍮' },
  ],

  vedettes: [
    {
      id: 'maquis-du-val',
      nom: 'Maquis du Val',
      cuisine: 'Ivoirien · Grillades',
      note: 4.8,
      avis: 312,
      temps: '25–35 min',
      frais: '500 F',
      distance: '1,2 km',
      badge: 'Le + commandé',
      image: u('photo-1544025162-d76694265947'),
    },
    {
      id: 'regal-afrique',
      nom: "Le Régal d'Afrique",
      cuisine: 'Africain · Braisé',
      note: 4.9,
      avis: 208,
      temps: '35–45 min',
      frais: '800 F',
      distance: '2,4 km',
      badge: 'Nouveau',
      image: u('photo-1504674900247-0877df9cc836'),
    },
    {
      id: 'pizza-bella',
      nom: 'Pizza Bella',
      cuisine: 'Pizzeria',
      note: 4.7,
      avis: 156,
      temps: '20–30 min',
      frais: 'Gratuit',
      distance: '900 m',
      image: u('photo-1565299624946-b28f40a0ae38'),
    },
  ] satisfies DemoRestaurant[],

  proches: [
    {
      id: 'maquis-du-val',
      nom: 'Maquis du Val',
      cuisine: 'Ivoirien · Grillades',
      note: 4.8,
      avis: 312,
      temps: '25–35 min',
      frais: '500 F',
      distance: '1,2 km',
      image: u('photo-1544025162-d76694265947'),
    },
    {
      id: 'grand-large',
      nom: 'Le Grand Large',
      cuisine: 'Franco-ivoirien',
      note: 4.6,
      avis: 189,
      temps: '30–40 min',
      frais: '700 F',
      distance: '1,8 km',
      image: u('photo-1552566626-52f8b828add9'),
    },
    {
      id: 'pizza-bella',
      nom: 'Pizza Bella',
      cuisine: 'Pizzeria · Italien',
      note: 4.7,
      avis: 156,
      temps: '20–30 min',
      frais: 'Gratuit',
      distance: '900 m',
      image: u('photo-1565299624946-b28f40a0ae38'),
    },
    {
      id: 'regal-afrique',
      nom: "Le Régal d'Afrique",
      cuisine: 'Africain · Braisé',
      note: 4.9,
      avis: 208,
      temps: '35–45 min',
      frais: '800 F',
      distance: '2,4 km',
      image: u('photo-1504674900247-0877df9cc836'),
    },
  ] satisfies DemoRestaurant[],

  restaurant: {
    id: 'maquis-du-val',
    nom: 'Maquis du Val',
    cuisine: 'Cuisine ivoirienne · Grillades au feu de bois',
    adresse: 'Quartier 2000, Yamoussoukro',
    note: 4.8,
    avis: 312,
    temps: '25–35 min',
    frais: '500 F',
    image: u('photo-1544025162-d76694265947'),
    ouvert: true,
    fermeture: '23 h 30',
  },

  categoriesMenu: ['Populaires', 'Grillades', 'Plats', 'Boissons'],

  plats: [
    {
      id: 'alloco-poulet',
      nom: 'Alloco & Poulet Braisé',
      description: 'Alloco doré, poulet braisé au feu de bois, sauce piment doux et oignons frais.',
      prix: 3500,
      image: u('photo-1598103442097-8b74394b95c6'),
      badge: 'Le + commandé',
      categorie: 'Populaires',
    },
    {
      id: 'attieke-poisson',
      nom: 'Attiéké Poisson Braisé',
      description: "Attiéké granuleux, poisson braisé du jour, tomates et piment vert.",
      prix: 4000,
      image: u('photo-1467003909585-2f8a72700288'),
      badge: 'Signature',
      categorie: 'Populaires',
    },
    {
      id: 'kedjenou',
      nom: 'Kedjenou de Poulet',
      description: 'Poulet mijoté à l’étouffée, tomates, aubergines et épices douces.',
      prix: 3800,
      image: u('photo-1604908176997-125f25cc6f3d'),
      categorie: 'Plats',
    },
    {
      id: 'bissap',
      nom: 'Bissap Maison',
      description: 'Jus d’hibiscus infusé à froid, 50 cl, peu sucré.',
      prix: 1000,
      image: u('photo-1544145945-f90425340c7e'),
      categorie: 'Boissons',
    },
    {
      id: 'gingembre',
      nom: 'Jus de Gingembre',
      description: 'Gingembre frais pressé, citron vert, 33 cl.',
      prix: 1000,
      image: u('photo-1513558161293-cdaf765ed2fd'),
      categorie: 'Boissons',
    },
  ] satisfies DemoDish[],

  panier: {
    restaurant: 'Maquis du Val',
    lignes: [
      {
        id: 'alloco-poulet',
        nom: 'Alloco & Poulet Braisé',
        options: 'Sauce piment doux · Sans oignon',
        prix: 3500,
        quantite: 1,
        image: u('photo-1598103442097-8b74394b95c6'),
      },
      {
        id: 'bissap',
        nom: 'Bissap Maison 50 cl',
        options: 'Peu sucré',
        prix: 1000,
        quantite: 2,
        image: u('photo-1544145945-f90425340c7e'),
      },
    ] satisfies DemoCartLine[],
    sousTotal: 5500,
    livraison: 500,
    total: 6000,
  },

  paiements: [
    { id: 'especes', nom: 'Espèces à la livraison', detail: 'Préparez 6 000 FCFA', icone: 'banknote' },
    { id: 'orange_money', nom: 'Orange Money', detail: 'Paiement instantané', icone: 'smartphone' },
    { id: 'mtn_money', nom: 'MTN Money', detail: 'Paiement instantané', icone: 'smartphone' },
  ],

  suivi: {
    numero: 'YK-4821',
    statut: 'En route vers vous',
    eta: '8 min',
    livreur: {
      nom: 'Samba K.',
      note: 4.9,
      courses: 428,
      vehicule: 'Yamaha MT-07 · AB 4521 CI',
      avatar: u('photo-1506794778202-cad84cf45f1d'),
    },
    etapes: [
      { label: 'Commande confirmée', detail: '21:02', fait: true },
      { label: 'En préparation', detail: '21:06', fait: true },
      { label: 'En route', detail: '21:18', fait: true, actif: true },
      { label: 'Livrée', detail: '≈ 21:26', fait: false },
    ],
  },
};

/**
 * Montant formaté en FCFA. `toLocaleString('fr-FR')` insère une espace fine
 * insécable (U+202F) ; on la remplace par une espace normale pour que la
 * séparation des milliers reste lisible dans les polices éditoriales.
 */
export const fcfa = (montant: number) =>
  `${montant.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;
