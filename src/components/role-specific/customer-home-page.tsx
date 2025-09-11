
'use client';

import * as React from 'react';
import { Pizza, Drumstick, Salad, Soup, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { useData } from '@/contexts/data-context';
import { SearchBar } from '@/components/search-bar';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { OrderStatus } from '@/components/order-status';
import type { Order, Restaurant, MenuItem } from '@/lib/types';
import { Recommendations, RecommendationsSkeleton } from '../recommendations';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Badge } from '../ui/badge';

interface Category {
    name: string;
    icon: React.ElementType;
}

const categories: Category[] = [
    { name: 'Ivoirien', icon: Soup },
    { name: 'Pizza', icon: Pizza },
    { name: 'Grillades', icon: Drumstick },
    { name: 'Salades', icon: Salad },
];

const generateUserHistorySummary = (orders: Order[], restaurants: Restaurant[]): string => {
  if (orders.length === 0) return "L'utilisateur n'a pas encore d'historique de commandes.";
  const cuisineCount: { [key: string]: number } = {};
  orders.forEach(order => {
    const restaurant = restaurants.find(r => r.id === order.restaurantId);
    if (restaurant) cuisineCount[restaurant.cuisine] = (cuisineCount[restaurant.cuisine] || 0) + 1;
  });
  const favoriteCuisine = Object.keys(cuisineCount).length > 0 ? Object.keys(cuisineCount).reduce((a, b) => cuisineCount[a] > cuisineCount[b] ? a : b) : 'inconnue';
  return `L'utilisateur a passé ${orders.length} commandes. Sa cuisine préférée semble être ${favoriteCuisine}.`;
}

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { restaurants, menuItems, orders, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  const [recommendationError, setRecommendationError] = React.useState(false);

  const userDeliveredOrders = React.useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.uid && o.statut === 'Livrée');
  }, [orders, user]);

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || menuItems.length === 0 || restaurants.length === 0) {
        setLoadingRecommendations(false);
        return;
      };
      setLoadingRecommendations(true);
      setRecommendationError(false);
      const userHistorySummary = generateUserHistorySummary(userDeliveredOrders, restaurants);

      const availableMenuItems = menuItems.map(item => {
        const restaurant = restaurants.find(r => r.id === item.restaurantId);
        return {
          id: item.id,
          nom: item.nom,
          description: item.description,
          prix: item.prix,
          nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
          cuisine: restaurant?.cuisine || 'Inconnue'
        }
      });
      
      try {
        const data = await getPersonalizedRecommendations({
          userHistory: userHistorySummary,
          availableMenuItems: availableMenuItems,
          currentLocation: 'Abidjan, Côte d\'Ivoire',
          timeOfDay: new Date().getHours() < 12 ? 'Matin' : (new Date().getHours() < 18 ? 'Après-midi' : 'Soir'),
        });
        setRecommendations(data);
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setRecommendationError(true);
        setRecommendations(null);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    if (!isLoading) {
      fetchRecommendations();
    }
  }, [user, userDeliveredOrders, restaurants, menuItems, isLoading]);

  const handleNewOrder = () => {
      setActiveOrder(null);
  };

  React.useEffect(() => {
    const findActiveOrder = () => {
       if (user && orders.length > 0) {
        const userOrders = orders.filter(o => o.userId === user.uid).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestActiveOrder = userOrders.find(o => o.statut !== 'Livrée' && o.statut !== 'Annulée');
        setActiveOrder(latestActiveOrder || null);
      } else {
        setActiveOrder(null);
      }
    }
    findActiveOrder();

    window.addEventListener('place-order', findActiveOrder);
    return () => window.removeEventListener('place-order', findActiveOrder);
  }, [orders, user]);
  
 const getFilteredRestaurants = () => {
    let allRestaurants = [...restaurants];
    let results: (Restaurant & { matchReason?: string })[] = [];

    if (!searchQuery && !interpretedSearch) {
        return {
            featured: allRestaurants.filter(r => r.enVedette),
            normal: allRestaurants.filter(r => !r.enVedette),
        };
    }

    const matchReasons = new Map<string, string>();
    let filteredRestaurantIds = new Set<string>();
    
    if (searchQuery && !interpretedSearch) {
        const lowercasedQuery = searchQuery.toLowerCase();
        allRestaurants.forEach(r => {
            if (r.nom.toLowerCase().includes(lowercasedQuery) || r.cuisine.toLowerCase().includes(lowercasedQuery)) {
                filteredRestaurantIds.add(r.id);
            }
        });
        menuItems.forEach(item => {
            if (item.nom.toLowerCase().includes(lowercasedQuery)) {
                filteredRestaurantIds.add(item.restaurantId);
                matchReasons.set(item.restaurantId, `Propose "${item.nom}"`);
            }
        });
    } else if (interpretedSearch) {
        const searchTerms = [...(interpretedSearch.keywords || []), ...(interpretedSearch.searchTerms || [])].map(t => t.toLowerCase());
        const lowerCuisines = (interpretedSearch.cuisine || []).map(c => c.toLowerCase());
        
        allRestaurants.forEach(r => {
            const matchesCuisine = lowerCuisines.length > 0 ? lowerCuisines.some(c => r.cuisine.toLowerCase().includes(c)) : false;
            const matchesRating = interpretedSearch.rating ? r.note >= interpretedSearch.rating : true;
            const matchesDeliveryTime = interpretedSearch.deliveryTime ? r.tempsDeLivraison <= interpretedSearch.deliveryTime : true;
            const matchesName = searchTerms.length > 0 ? searchTerms.some(term => r.nom.toLowerCase().includes(term)) : false;

            if ((matchesCuisine || matchesName) && matchesRating && matchesDeliveryTime) {
                filteredRestaurantIds.add(r.id);
            }
        });
      
        if (searchTerms.length > 0) {
            menuItems.forEach(item => {
                if (searchTerms.some(term => item.nom.toLowerCase().includes(term))) {
                    filteredRestaurantIds.add(item.restaurantId);
                    matchReasons.set(item.restaurantId, `Propose "${item.nom}"`);
                }
            });
        }
    }

    results = allRestaurants
        .filter(r => filteredRestaurantIds.has(r.id))
        .map(r => ({
            ...r,
            matchReason: matchReasons.get(r.id),
        }));

    return {
        featured: [], // No featured list on search results page
        normal: results,
    };
};

  const { featuredRestaurants, normalRestaurants } = getFilteredRestaurants() || { featured: [], normal: [] };

  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => (
    <div key={`skeleton-resto-${i}`} className="flex flex-col space-y-3">
      <Skeleton className="h-[160px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ));
  
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {activeOrder ? (
          <OrderStatus order={activeOrder} onNewOrder={handleNewOrder} />
      ) : (
        <section className="text-center bg-card p-6 md:p-12 rounded-2xl shadow-lg">
          <h1 className="text-3xl md:text-5xl font-headline text-primary">Votre ville, livrée.</h1>
          <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Les meilleurs plats des restaurants de Yamoussoukro, directement chez vous.
          </p>
          <div className="mt-6 max-w-xl mx-auto">
            <SearchBar onSearchChange={setSearchQuery} onInterpretedSearchChange={setInterpretedSearch} />
          </div>
        </section>
      )}

      {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} hasError={recommendationError} />}
      
      {featuredRestaurants.length > 0 && (
          <section>
             <div className="flex items-center gap-4 mb-6">
                <Star className="text-primary fill-primary" />
                <h2 className="text-2xl md:text-3xl font-headline text-foreground">Restaurants en vedette</h2>
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {isLoading ? renderSkeletons(3) : featuredRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} featured />
              ))}
            </div>
          </section>
      )}


      <section>
        <h2 className="text-2xl md:text-3xl font-headline text-foreground mb-6">Explorer par catégories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Card key={category.name} className="flex flex-col items-center justify-center p-6 hover:bg-primary/10 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <category.icon className="w-12 h-12 text-primary mb-2"/>
              <p className="font-semibold text-lg">{category.name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-headline text-foreground">
            {searchQuery || interpretedSearch ? 'Résultats de la recherche' : 'Tous les Restaurants'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? renderSkeletons(6) : normalRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} matchReason={restaurant.matchReason} />
          ))}
        </div>
         {normalRestaurants.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-center col-span-full">Aucun restaurant ne correspond à votre recherche.</p>
        )}
      </section>

      <section>
        <Card className="bg-primary text-primary-foreground p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-headline">Vous êtes un restaurateur ?</h2>
            <p className="mt-2 max-w-lg opacity-90">Rejoignez notre plateforme pour atteindre plus de clients et développer votre activité.</p>
          </div>
          <Button variant="secondary" size="lg" className="shrink-0" asChild>
            <Link href="/dashboard/new-restaurant">Rejoindre l'aventure</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
