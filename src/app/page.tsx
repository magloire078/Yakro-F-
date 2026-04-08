'use client';

import * as React from 'react';
import { Pizza, Drumstick, Salad, Soup, Star, Timer, Truck, TrendingUp, MapPin, Sparkles as SparklesIcon } from 'lucide-react';
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
import { Recommendations, RecommendationsSkeleton } from '@/components/recommendations';
import { getPersonalizedRecommendationsAction } from '@/app/actions/ai-actions';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Category {
    name: string;
    icon: React.ElementType;
}

const cuisineToIconMap: { [key: string]: React.ElementType } = {
    'ivoirien': Soup,
    'ivoirienne': Soup,
    'pizza': Pizza,
    'pizzeria': Pizza,
    'grillades': Drumstick,
    'salades': Salad,
    'française': SparklesIcon,
    'pâtisserie': SparklesIcon,
    'default': SparklesIcon
};

const getIconForCuisine = (cuisine: string): React.ElementType => {
    const lowerCuisine = cuisine.toLowerCase();
    for (const key in cuisineToIconMap) {
        if (lowerCuisine.includes(key)) {
            return cuisineToIconMap[key];
        }
    }
    return cuisineToIconMap.default;
};


type SortFilter = 'rating' | 'time' | 'delivery' | 'distance' | null;

type Coordinates = {
  latitude: number;
  longitude: number;
}

const generateUserHistorySummary = (orders: Order[], restaurants: Restaurant[]): string => {
  if (orders.length === 0) return "L'utilisateur n'a pas encore d'historique de commandes.";
  const cuisineCount: { [key: string]: number } = {};
  orders.forEach(order => {
    const restaurant = restaurants.find(r => r && r.id === order.restaurantId);
    if (restaurant && restaurant.cuisine) cuisineCount[restaurant.cuisine] = (cuisineCount[restaurant.cuisine] || 0) + 1;
  });
  const favoriteCuisine = Object.keys(cuisineCount).length > 0 ? Object.keys(cuisineCount).reduce((a, b) => cuisineCount[a] > cuisineCount[b] ? a : b) : 'inconnue';
  return `L'utilisateur a passé ${orders.length} commandes. Sa cuisine préférée semble être ${favoriteCuisine}.`;
}

// Haversine formula to calculate distance between two lat/lon points
const getDistance = (coords1: Coordinates, coords2: Coordinates) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
};

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { restaurants, menuItems, orders, isLoading } = useData();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  const [recommendationError, setRecommendationError] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<SortFilter>(null);
  const [userLocation, setUserLocation] = React.useState<Coordinates | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);


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
        const restaurant = restaurants.find(r => r && r.id === item.restaurantId);
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
        const result = await getPersonalizedRecommendationsAction({
          userHistory: userHistorySummary,
          availableMenuItems: availableMenuItems,
          currentLocation: 'Abidjan, Côte d\'Ivoire',
          timeOfDay: new Date().getHours() < 12 ? 'Matin' : (new Date().getHours() < 18 ? 'Après-midi' : 'Soir'),
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        setRecommendations(result.data);
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

  const { featuredRestaurants, normalRestaurants, categories } = React.useMemo(() => {
    let filteredRestaurants: (Restaurant & { matchReason?: string, distance?: number })[] = [];
    const validRestaurants = restaurants.filter(Boolean);

    // Categories generation
    const allCuisines = new Set(validRestaurants.map(r => r.cuisine.trim()).filter(Boolean));
    const dynamicCategories: Category[] = Array.from(allCuisines).slice(0, 4).map(cuisine => ({
        name: cuisine,
        icon: getIconForCuisine(cuisine)
    }));


    if (!isLoading && validRestaurants && validRestaurants.length > 0) {
      if (!searchQuery && !interpretedSearch && !selectedCategory) {
        filteredRestaurants = validRestaurants;
      } else {
        const searchTerms = [
          ...(interpretedSearch?.keywords || []),
          ...(interpretedSearch?.searchTerms || []),
          searchQuery,
        ]
          .map(t => t.toLowerCase())
          .filter(Boolean);

        const lowerCuisines = (interpretedSearch?.cuisine || []).map(c =>
          c.toLowerCase()
        );
        const matchReasons = new Map<string, string>();

        filteredRestaurants = validRestaurants
          .filter(r => {
            if (!r || !r.nom || !r.cuisine) return false;
            
            // Category filter
            if (selectedCategory && r.cuisine.toLowerCase() !== selectedCategory.toLowerCase()) {
                return false;
            }

            const matchesCuisine =
              lowerCuisines.length > 0 &&
              lowerCuisines.some(c => r.cuisine.toLowerCase().includes(c));
            const matchesRating = interpretedSearch?.rating
              ? r.note >= interpretedSearch.rating
              : true;
            const matchesDeliveryTime = interpretedSearch?.deliveryTime
              ? r.tempsDeLivraison <= interpretedSearch.deliveryTime
              : true;
            const matchesNameOrQuery =
              searchTerms.length > 0 &&
              searchTerms.some(
                term =>
                  r.nom.toLowerCase().includes(term) ||
                  r.cuisine.toLowerCase().includes(term)
              );

            const itemMatch = menuItems
              .filter(item => item && item.restaurantId === r.id)
              .find(item =>
                searchTerms.some(term => item.nom.toLowerCase().includes(term))
              );

            if (itemMatch) {
              matchReasons.set(r.id, `Propose "${itemMatch.nom}"`);
              return true;
            }

            // If a category is selected, we don't need other criteria to match unless there's a search term
            if (selectedCategory) {
                if (searchQuery || interpretedSearch) {
                     return (matchesCuisine || matchesNameOrQuery) && matchesRating && matchesDeliveryTime;
                }
                return true;
            }

            return (
              (matchesCuisine || matchesNameOrQuery) &&
              matchesRating &&
              matchesDeliveryTime
            );
          })
          .map(r => ({ ...r, matchReason: matchReasons.get(r.id) }));
      }
    }
    
    // Add distance to each restaurant if user location is available
    if(userLocation) {
        filteredRestaurants = filteredRestaurants.map(r => {
            if (r.latitude && r.longitude) {
                return { ...r, distance: getDistance(userLocation, { latitude: r.latitude, longitude: r.longitude }) };
            }
            return { ...r, distance: Infinity };
        });
    }
    
    let sortedRestaurants = [...filteredRestaurants];
    if (activeFilter) {
        switch (activeFilter) {
            case 'rating':
                sortedRestaurants.sort((a, b) => b.note - a.note);
                break;
            case 'time':
                sortedRestaurants.sort((a, b) => a.tempsDeLivraison - b.tempsDeLivraison);
                break;
            case 'delivery':
                sortedRestaurants.sort((a, b) => a.fraisDeLivraison - b.fraisDeLivraison);
                break;
            case 'distance':
                sortedRestaurants.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                break;
        }
    }

    const validFilteredRestaurants = sortedRestaurants.filter(Boolean);

    return {
        featuredRestaurants: validFilteredRestaurants.filter(r => r.enVedette),
        normalRestaurants: validFilteredRestaurants.filter(r => !r.enVedette),
        categories: dynamicCategories,
    }

  }, [isLoading, restaurants, menuItems, searchQuery, interpretedSearch, activeFilter, userLocation, selectedCategory]);

  const handleLocationFilter = () => {
    if (activeFilter === 'distance') {
      setActiveFilter(null);
      return;
    }

    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Géolocalisation non supportée' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setActiveFilter('distance');
      },
      () => {
        toast({ variant: 'destructive', title: "L'accès à la localisation a été refusé." });
      }
    );
  };
  
  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
        setSelectedCategory(null); // Unselect if clicked again
    } else {
        setSelectedCategory(categoryName);
    }
  };


  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => (
    <div key={`skeleton-resto-${i}`} className="flex flex-col space-y-3">
      <Skeleton className="h-[160px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ));

   const getFilterLabel = () => {
    if (selectedCategory) return selectedCategory;
    switch (activeFilter) {
      case 'rating': return 'Bien notés';
      case 'time': return 'Plus rapides';
      case 'delivery': return 'Moins chers';
      case 'distance': return 'À proximité';
      default: return null;
    }
  };
  
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {activeOrder ? (
          <OrderStatus order={activeOrder} onNewOrder={handleNewOrder} />
      ) : (
        <section className="text-center bg-card p-6 md:p-12 rounded-2xl shadow-lg">
          <h1 className="text-2xl md:text-3xl font-headline text-primary">Les saveurs de Yakro, chez vous.</h1>
          <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Les meilleurs plats des restaurants de Yamoussoukro, directement chez vous.
          </p>
          <div className="mt-6 max-w-xl mx-auto">
            <SearchBar onSearchChange={setSearchQuery} onInterpretedSearchChange={setInterpretedSearch} />
             <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
                <Button size="sm" variant={activeFilter === 'rating' ? 'default' : 'outline'} onClick={() => setActiveFilter(activeFilter === 'rating' ? null : 'rating')}>
                    <TrendingUp /> Mieux notés
                </Button>
                <Button size="sm" variant={activeFilter === 'time' ? 'default' : 'outline'} onClick={() => setActiveFilter(activeFilter === 'time' ? null : 'time')}>
                    <Timer /> Rapides
                </Button>
                <Button size="sm" variant={activeFilter === 'delivery' ? 'default' : 'outline'} onClick={() => setActiveFilter(activeFilter === 'delivery' ? null : 'delivery')}>
                    <Truck /> Économiques
                </Button>
                <Button size="sm" variant={activeFilter === 'distance' ? 'default' : 'outline'} onClick={handleLocationFilter}>
                    <MapPin /> À proximité
                </Button>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {isLoading ? renderSkeletons(4) : featuredRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} featured />
              ))}
            </div>
          </section>
      )}


      <section>
        <h2 className="text-2xl md:text-3xl font-headline text-foreground mb-6">Explorer par catégories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Card 
                key={category.name} 
                className={cn("flex flex-col items-center justify-center p-6 hover:bg-primary/10 hover:shadow-lg transition-all duration-300 cursor-pointer",
                    selectedCategory === category.name && "bg-primary/10 border-primary"
                )}
                onClick={() => handleCategorySelect(category.name)}
            >
              <category.icon className="w-12 h-12 text-primary mb-2"/>
              <p className="font-semibold text-lg">{category.name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">
              {searchQuery || interpretedSearch || activeFilter || selectedCategory ? 'Résultats' : 'Tous les Restaurants'}
            </h2>
            {getFilterLabel() && <Badge>{getFilterLabel()}</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? renderSkeletons(8) : normalRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} matchReason={restaurant.matchReason} distance={restaurant.distance} />
          ))}
        </div>
         {normalRestaurants.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-center col-span-full">Aucun restaurant ne correspond à votre recherche.</p>
        )}
      </section>

      <section>
        <Card className="bg-primary text-primary-foreground p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline">Vous êtes un restaurateur ?</h2>
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
