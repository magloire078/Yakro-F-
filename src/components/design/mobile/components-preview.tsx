'use client';

import { MenuItemCard } from '@/components/menu-item-card';
import { RestaurantCard } from '@/components/restaurant-card';
import { Dock, DockFab } from '@/components/mobile-ui';
import { Home, Compass, ReceiptText, UserRound, ShoppingBag } from 'lucide-react';
import type { MenuItem, Restaurant } from '@/lib/types';

const IMG = {
  braise: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  africain: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
  poulet: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=80',
  poisson: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
};

const baseRestaurant = { proprietaireId: 'demo', indiceImage: 'demo' };

const RESTAURANTS: Restaurant[] = [
  {
    ...baseRestaurant,
    id: 'maquis-du-val',
    nom: 'Maquis du Val',
    cuisine: 'Ivoirien · Grillades',
    note: 4.8,
    tempsDeLivraison: 28,
    fraisDeLivraison: 500,
    image: IMG.braise,
    adresse: 'Quartier 2000, Yamoussoukro',
    enVedette: true,
  },
  {
    ...baseRestaurant,
    id: 'regal-afrique',
    nom: "Le Régal d'Afrique",
    cuisine: 'Africain · Braisé',
    note: 4.9,
    tempsDeLivraison: 38,
    fraisDeLivraison: 800,
    image: IMG.africain,
  },
  {
    ...baseRestaurant,
    id: 'pizza-bella',
    nom: 'Pizza Bella',
    cuisine: 'Pizzeria · Italien',
    note: 4.7,
    tempsDeLivraison: 24,
    fraisDeLivraison: 0,
    image: IMG.pizza,
  },
];

const PLATS: MenuItem[] = [
  {
    id: 'alloco-poulet',
    nom: 'Alloco & Poulet Braisé',
    description: 'Alloco doré, poulet braisé au feu de bois, sauce piment doux et oignons frais.',
    prix: 3500,
    categorie: 'Plat',
    image: IMG.poulet,
    indiceImage: 'alloco-poulet',
    restaurantId: 'maquis-du-val',
  },
  {
    id: 'attieke-poisson',
    nom: 'Attiéké Poisson Braisé',
    description: 'Attiéké granuleux, poisson braisé du jour, tomates et piment vert.',
    prix: 4000,
    categorie: 'Plat',
    image: IMG.poisson,
    indiceImage: 'attieke-poisson',
    restaurantId: 'maquis-du-val',
  },
];

export function ComponentsPreview() {
  return (
    <div className="yk-screen mx-auto min-h-dvh w-full max-w-[440px] px-4 pb-40 pt-6">
      <p className="yk-label text-orange-600 dark:text-orange-400">Yakro Elite · composants réels</p>
      <h1 className="yk-display mt-1 text-[28px] leading-tight">
        Composants <span className="yk-italic">intégrés</span>
      </h1>
      <p className="mt-2 text-[12.5px] text-[#6B625A] dark:text-white/55">
        Rendus par les vrais composants de l&apos;application (données de démonstration).
      </p>

      <p className="yk-label mt-7 block">Carte — grille (défaut)</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <RestaurantCard restaurant={RESTAURANTS[0]} featured />
        <RestaurantCard restaurant={RESTAURANTS[1]} matchReason="Propose l'attiéké" />
      </div>

      <p className="yk-label mt-7 block">Carte — vedette (carrousel)</p>
      <div className="scrollbar-hide -mx-4 mt-3 flex gap-3.5 overflow-x-auto px-4 pb-2">
        {RESTAURANTS.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            featured
            variant="featured"
            distance={1.2}
          />
        ))}
      </div>

      <p className="yk-label mt-7 block">Carte — ligne (liste)</p>
      <div className="mt-3 space-y-3">
        {RESTAURANTS.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="row" distance={2.4} />
        ))}
      </div>

      <p className="yk-label mt-7 block">Lignes de plat</p>
      <div className="mt-3 space-y-3">
        {PLATS.map((plat) => (
          <MenuItemCard key={plat.id} item={plat} />
        ))}
      </div>

      <p className="yk-label mt-7 block">Dock client (FAB panier)</p>
      <div className="relative mt-3 h-[120px] rounded-[1.5rem] border border-dashed border-black/10 dark:border-white/10">
        <p className="absolute inset-x-0 top-4 text-center text-[11px] text-[#8A8078] dark:text-white/40">
          Le dock est fixé en bas de l&apos;écran
        </p>
        <Dock
          items={[
            { id: 'accueil', href: '/design/mobile', label: 'Accueil', icon: Home },
            { id: 'explorer', href: '/design/mobile/composants', label: 'Explorer', icon: Compass },
            { id: 'commandes', href: '/design/mobile/suivi', label: 'Commandes', icon: ReceiptText },
            { id: 'profil', href: '/design/mobile', label: 'Moi', icon: UserRound },
          ]}
          activeId="accueil"
          center={
            <DockFab label="Panier" badge={3}>
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </DockFab>
          }
        />
      </div>
    </div>
  );
}
