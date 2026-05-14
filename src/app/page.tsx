'use client';

import * as React from 'react';
import { LandingPage } from '@/components/landing-page';
import { Pizza, Drumstick, Salad, Soup, Star, Timer, Truck, TrendingUp, MapPin, Sparkles as SparklesIcon, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { useData } from '@/contexts/data-context';
import { IntelligentSearchBar } from '@/components/intelligent-search-bar';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { OrderStatus } from '@/components/order-status';
import type { Order, Restaurant } from '@/lib/types';
import { Recommendations, RecommendationsSkeleton } from '@/components/recommendations';
import { getPersonalizedRecommendationsAction } from '@/app/actions/ai-actions';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { getCurrentLocation } from '@/lib/geolocation';

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
  const [recommendationError, setRecommendationError] = React.useState<string | null>(null);
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
      setRecommendationError(null);
      
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
        const error = e as Error;
        console.error("Error fetching recommendations:", error);
        setRecommendationError(error.message || "Impossible de charger les recommandations.");
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
    
    if(userLocation) {
        filteredRestaurants = filteredRestaurants.map(r => {
            if (r.latitude && r.longitude) {
                return { ...r, distance: getDistance(userLocation, { latitude: r.latitude, longitude: r.longitude }) };
            }
            return { ...r, distance: Infinity };
        });
    }
    
    const sortedRestaurants = [...filteredRestaurants];
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

    getCurrentLocation()
      .then((coords) => {
        setUserLocation(coords);
        setActiveFilter('distance');
      })
      .catch((error) => {
        console.warn('Distance filter geolocation error:', error?.message ?? error);
        toast({
          variant: 'destructive',
          title: 'Position indisponible',
          description: "Vérifiez les autorisations de localisation de votre navigateur.",
        });
      });
  };
  
  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
        setSelectedCategory(null);
    } else {
        setSelectedCategory(categoryName);
    }
  };

  const getFilterLabel = () => {
    if (selectedCategory) return selectedCategory;
    switch (activeFilter) {
      case 'rating': return 'Mieux notés';
      case 'time': return 'Plus rapides';
      case 'delivery': return 'Moins chers';
      case 'distance': return 'À proximité';
      default: return null;
    }
  };

  if (isLoading) {
    return <CustomerHomePageSkeleton />;
  }

  if (!user) {
    return <LandingPage />;
  }
  
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {activeOrder ? (
          <OrderStatus order={activeOrder} onNewOrder={handleNewOrder} />
      ) : (
        <section className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] min-h-[500px] flex items-center justify-center shadow-2xl bg-slate-900">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform animate-slow-zoom hover:scale-110 bg-[url('/assets/marketing/hero-basilica.png')]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-black/40" />
          
          <div className="relative z-10 w-full px-6 py-12 md:py-24 text-center space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-orange text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-float">
                    <SparklesIcon className="h-4 w-4 text-orange-400" />
                    Propulsé par Yakro Intelligence
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter uppercase italic">
                    L&apos;Élite de <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">Yakro</span><br />
                    À votre porte.
                </h1>
                <p className="mt-6 text-base md:text-xl text-slate-200 max-w-xl mx-auto font-medium leading-relaxed opacity-80">
                    Découvrez une expérience gastronomique transcendée par l&apos;intelligence artificielle.
                </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="max-w-2xl mx-auto"
            >
              <IntelligentSearchBar 
                onSearchChange={setSearchQuery} 
                onInterpretedSearchChange={setInterpretedSearch} 
              />
              
              <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-4">
                {[
                  { id: 'rating', icon: TrendingUp, label: 'Mieux notés' },
                  { id: 'time', icon: Timer, label: 'Rapides' },
                  { id: 'delivery', icon: Truck, label: 'Économiques' },
                ].map((filter) => (
                  <Button 
                    key={filter.id}
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                        "rounded-xl glass-dark text-white border-white/5 px-5 py-6 hover:bg-orange-500/20 transition-all active:scale-95",
                        activeFilter === filter.id && "bg-orange-600/80 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    )}
                    onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id as SortFilter)}
                  >
                    <filter.icon className="mr-2 h-4 w-4"/> {filter.label}
                  </Button>
                ))}
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                        "rounded-xl glass-dark text-white border-white/5 px-5 py-6 hover:bg-orange-500/20 transition-all active:scale-95",
                        activeFilter === 'distance' && "bg-orange-600/80 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    )}
                    onClick={handleLocationFilter}
                >
                    <MapPin className="mr-2 h-4 w-4"/> À proximité
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      {/* Hot Picks Section */}
      {!isLoading && restaurants.length > 0 && !searchQuery && !selectedCategory && (
        <section className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl">
                 <Flame className="text-red-600 fill-red-600 animate-bounce" size={24} />
               </div>
               <h2 className="text-2xl md:text-3xl font-headline text-foreground">Coups de Cœur</h2>
            </div>
            <Badge variant="hot">OFFRES PIMENTÉES</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
             {restaurants.filter(r => r.note >= 4.8).slice(0, 4).map(restaurant => (
              <RestaurantCard key={`hot-${restaurant.id}`} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      {loadingRecommendations ? (
          <RecommendationsSkeleton />
      ) : (
          <Recommendations recommendationsData={recommendations} hasError={!!recommendationError} />
      )}
      
      {recommendationError && user && (
          <div className="text-center text-muted-foreground -mt-8">
              <p className="text-sm">Service de recommandations IA temporairement indisponible.</p>
          </div>
      )}
      
      {featuredRestaurants.length > 0 && !selectedCategory && !searchQuery && (
          <section>
             <div className="flex items-center gap-4 mb-6">
                <Star className="text-primary fill-primary" />
                <h2 className="text-2xl md:text-3xl font-headline text-foreground">Restaurants en vedette</h2>
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
               {featuredRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} featured />
              ))}
            </div>
          </section>
      )}

      <section>
        <div className="flex items-center gap-4 mb-8">
            <div className="h-8 w-1 bg-orange-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">Explorer par catégories</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
            >
                <Card 
                    className={cn("group flex flex-col items-center justify-center p-6 md:p-8 glass transition-all duration-500 cursor-pointer rounded-[2rem] border-white/5 dark:border-white/5",
                        selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "bg-orange-500 text-white shadow-[0_20px_40px_rgba(249,115,22,0.3)] scale-105 border-orange-400" : "hover:bg-white/10 dark:hover:bg-white/5"
                    )}
                    onClick={() => handleCategorySelect(category.name)}
                >
                  <div className={cn(
                    "p-4 rounded-2xl transition-all duration-500 mb-4 shadow-inner",
                    selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500"
                  )}>
                    <category.icon className={cn(
                      "w-8 h-8 transition-colors duration-500",
                      selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "text-white" : "text-orange-500 group-hover:text-white"
                    )}/>
                  </div>
                  <p className="font-black uppercase tracking-tighter text-sm md:text-base">{category.name}</p>
                </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="restaurants">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">
              {searchQuery || interpretedSearch || activeFilter || selectedCategory ? 'Résultats de recherche' : 'Tous les Restaurants'}
            </h2>
            {getFilterLabel() && <Badge variant="secondary" className="px-3 py-1 font-medium">{getFilterLabel()}</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
           {normalRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} matchReason={restaurant.matchReason} distance={restaurant.distance} />
          ))}
        </div>
         {normalRestaurants.length === 0 && (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg italic">Aucun restaurant ne correspond à votre recherche.</p>
                <Button variant="link" onClick={() => { setSearchQuery(''); setInterpretedSearch(null); setSelectedCategory(null); setActiveFilter(null); }} className="mt-2">
                    Réinitialiser les filtres
                </Button>
            </div>
        )}
      </section>

      <section>
        <Card className="bg-primary text-primary-foreground p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-headline">Vous êtes un restaurateur ?</h2>
            <p className="mt-2 max-w-lg opacity-90">Rejoignez notre plateforme pour atteindre plus de clients et développer votre activité à Yamoussoukro.</p>
          </div>
          <Button variant="secondary" size="lg" className="shrink-0 font-bold" asChild>
            <Link href="/dashboard/new-restaurant">Rejoindre l&apos;aventure</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

function CustomerHomePageSkeleton() {
    return (
        <div className="flex flex-col gap-12 md:gap-16">
            <section className="bg-card p-6 md:p-12 rounded-2xl shadow-md space-y-4">
                <Skeleton className="h-10 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-full max-w-xl mx-auto rounded-full mt-6" />
                <div className="flex justify-center gap-2 mt-4">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </section>
            
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
            
             <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                         <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
