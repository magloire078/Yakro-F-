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
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
      {activeOrder ? (
          <OrderStatus order={activeOrder} onNewOrder={handleNewOrder} />
      ) : (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] min-h-[280px] sm:min-h-[360px] md:min-h-[420px] flex items-center justify-center shadow-2xl bg-slate-950">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform animate-slow-zoom hover:scale-105 bg-[url('/assets/marketing/hero-basilica.png')]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />
          
          <div className="relative z-10 w-full px-4 sm:px-6 py-6 sm:py-10 md:py-14 text-center space-y-3.5 sm:space-y-5">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/30 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2.5 sm:mb-4 animate-float shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-orange-400">Orange</span>
                    <span className="opacity-40">•</span>
                    <span className="text-white">Blanc</span>
                    <span className="opacity-40">•</span>
                    <span className="text-emerald-400">Vert</span>
                    <span className="opacity-40 mx-1">|</span>
                    <span>Yakro Intelligence</span>
                </div>
                <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.02] tracking-tighter uppercase italic drop-shadow-lg">
                    L&apos;Élite de <span className="text-primary drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">Yakro</span> <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">Fê</span><br />
                    À votre porte.
                </h1>
                <p className="mt-1.5 sm:mt-3 text-xs sm:text-base md:text-lg text-slate-200 max-w-lg mx-auto font-medium leading-relaxed opacity-90 line-clamp-2 sm:line-clamp-none">
                    L&apos;expérience gastronomique transcendée par l&apos;intelligence artificielle.
                </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.96 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.4, delay: 0.1 }}
               className="max-w-2xl mx-auto"
            >
              <IntelligentSearchBar 
                onSearchChange={setSearchQuery} 
                onInterpretedSearchChange={setInterpretedSearch} 
              />
              
              <div className="mt-3 sm:mt-5 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {[
                  { id: 'rating', icon: TrendingUp, label: 'Mieux notés' },
                  { id: 'time', icon: Timer, label: 'Rapides' },
                  { id: 'delivery', icon: Truck, label: 'Éco' },
                ].map((filter) => (
                  <Button 
                    key={filter.id}
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                        "rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/15 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 h-7 sm:h-9 text-xs sm:text-sm hover:border-primary/50 transition-all active:scale-95",
                        activeFilter === filter.id && "bg-primary hover:bg-primary/90 text-white border-primary shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    )}
                    onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id as SortFilter)}
                  >
                    <filter.icon className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5"/> {filter.label}
                  </Button>
                ))}
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                        "rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/15 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 h-7 sm:h-9 text-xs sm:text-sm hover:border-primary/50 transition-all active:scale-95",
                        activeFilter === 'distance' && "bg-primary hover:bg-primary/90 text-white border-primary shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    )}
                    onClick={handleLocationFilter}
                >
                    <MapPin className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5"/> À proximité
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section>
        <div className="flex items-center gap-2 mb-2.5 sm:mb-4">
            <div className="flex h-4 sm:h-5 w-1.5 flex-col rounded-full overflow-hidden shrink-0 shadow-xs">
                <div className="flex-1 bg-orange-500" />
                <div className="flex-1 bg-white dark:bg-slate-300" />
                <div className="flex-1 bg-emerald-500" />
            </div>
            <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tight text-foreground">Explorer par catégories</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {categories.map((category, index) => (
            <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                viewport={{ once: true }}
            >
                <Card 
                    className={cn("group flex flex-col items-center justify-center p-2.5 sm:p-4 bg-card hover:bg-accent/10 transition-all duration-300 cursor-pointer rounded-2xl border border-border shadow-sm",
                        selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "bg-primary text-white shadow-lg scale-105 border-primary" : "hover:border-primary/40"
                    )}
                    onClick={() => handleCategorySelect(category.name)}
                >
                  <div className={cn(
                    "p-2 sm:p-3 rounded-xl transition-all duration-300 mb-1 sm:mb-2 shadow-inner",
                    selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "bg-white/20" : "bg-muted group-hover:bg-primary/20"
                  )}>
                    <category.icon className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                      selectedCategory?.toLowerCase() === category.name.toLowerCase() ? "text-white" : "text-primary"
                    )}/>
                  </div>
                  <p className="font-black uppercase tracking-tight text-[9px] sm:text-xs text-center truncate w-full">{category.name}</p>
                </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hot Picks Section */}
      {!isLoading && restaurants.length > 0 && !searchQuery && !selectedCategory && (
        <section className="relative">
          <div className="flex items-center justify-between mb-2.5 sm:mb-4">
            <div className="flex items-center gap-2">
               <div className="p-1 sm:p-1.5 bg-red-500/10 rounded-lg">
                 <Flame className="text-red-500 fill-red-500 h-3.5 w-3.5 sm:h-4 sm:w-4" />
               </div>
               <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tight text-foreground">Coups de Cœur</h2>
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-red-500 border-red-500/30 bg-red-500/5 py-0.5 px-2">OFFRES CHAUDES</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
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
          <div className="text-center text-muted-foreground -mt-2">
              <p className="text-xs">Service de recommandations IA temporairement indisponible.</p>
          </div>
      )}
      
      {featuredRestaurants.length > 0 && !selectedCategory && !searchQuery && (
          <section>
             <div className="flex items-center gap-2 mb-2.5 sm:mb-4">
                <Star className="text-primary fill-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tight text-foreground">Restaurants en vedette</h2>
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
               {featuredRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} featured />
              ))}
            </div>
          </section>
      )}

      <section id="restaurants">
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tight text-foreground">
              {searchQuery || interpretedSearch || activeFilter || selectedCategory ? 'Résultats de recherche' : 'Tous les Restaurants'}
            </h2>
            {getFilterLabel() && <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{getFilterLabel()}</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
           {normalRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} matchReason={restaurant.matchReason} distance={restaurant.distance} />
          ))}
        </div>
         {normalRestaurants.length === 0 && (
            <div className="text-center py-10 bg-card rounded-2xl border border-border p-6 space-y-3">
                <p className="text-muted-foreground text-sm font-medium italic">Aucun restaurant ne correspond à votre recherche.</p>
                <Button 
                  onClick={() => { setSearchQuery(''); setInterpretedSearch(null); setSelectedCategory(null); setActiveFilter(null); }} 
                  className="h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-black italic text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                >
                    Réinitialiser les filtres
                </Button>
            </div>
        )}
      </section>

      <section>
        <Card className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Vous êtes un restaurateur ?</h2>
            <p className="text-xs sm:text-sm max-w-lg text-white/90 font-medium leading-relaxed">Rejoignez notre plateforme d&apos;élite pour atteindre plus de clients et décupler votre chiffre d&apos;affaires à Yamoussoukro.</p>
          </div>
          <Button size="lg" className="shrink-0 font-black italic uppercase tracking-tight rounded-xl px-6 h-12 text-xs sm:text-sm bg-slate-950 hover:bg-slate-900 text-white shadow-2xl border border-white/10 transition-all hover:scale-105 active:scale-95" asChild>
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
