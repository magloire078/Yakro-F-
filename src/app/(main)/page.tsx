

'use client';

import * as React from 'react';
import { UtensilsCrossed, Image as ImageIcon, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { MenuItemCard } from '@/components/menu-item-card';
import { Recommendations, RecommendationsSkeleton } from '@/components/recommendations';
import { OrderStatus } from '@/components/order-status';
import { useCart } from '@/contexts/cart-context';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import type { Order, Restaurant } from '@/lib/types';
import { SearchBar } from '@/components/search-bar';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';


// Helper function to generate user history summary
const generateUserHistorySummary = (orders: Order[], restaurants: Restaurant[]): string => {
  if (orders.length === 0) {
    return "L'utilisateur n'a pas encore d'historique de commandes.";
  }
  const cuisineCount: { [key: string]: number } = {};
  const itemCount: { [key: string]: number } = {};
  let totalSpent = 0;

  orders.forEach(order => {
    totalSpent += order.total;
    const restaurant = restaurants.find(r => r.id === order.restaurantId);
    if (restaurant) {
      cuisineCount[restaurant.cuisine] = (cuisineCount[restaurant.cuisine] || 0) + 1;
    }
    order.items.forEach(item => {
      itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
    });
  });
  
  const favoriteCuisine = Object.keys(cuisineCount).length > 0 
    ? Object.keys(cuisineCount).reduce((a, b) => cuisineCount[a] > cuisineCount[b] ? a : b, '')
    : 'inconnue';
  
  const favoriteItems = Object.entries(itemCount)
    .sort((a,b) => b[1] - a[1])
    .slice(0,3)
    .map(item => item[0]);

  return `L'utilisateur a passé ${orders.length} commandes pour un total de ${totalSpent.toLocaleString('fr-FR')} FCFA. Sa cuisine préférée semble être ${favoriteCuisine}. Il commande fréquemment les plats suivants : ${favoriteItems.join(', ')}.`;
}


export default function Home() {
  const { clearCart } = useCart();
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  const { user } = useAuth();
  
  const { 
    restaurants, 
    menuItems, 
    orders,
    isGenerating, 
    generateAllImages,
    isLoading,
  } = useData();
  
  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);
  
  const userDeliveredOrders = React.useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.uid && o.status === 'Livrée');
  }, [orders, user]);

  // Check for active orders for the current user
  React.useEffect(() => {
    if (user && orders.length > 0) {
        const activeUserOrder = orders.find(o => o.userId === user.uid && o.status !== 'Livrée' && o.status !== 'Annulée');
        if (activeUserOrder) {
            setIsOrderPlaced(true);
        } else {
            setIsOrderPlaced(false);
        }
    } else {
        setIsOrderPlaced(false);
    }
  }, [orders, user]);


  React.useEffect(() => {
    const fetchRecommendations = async () => {
        if (isLoading) return; // Wait for initial data to be loaded
        setLoadingRecommendations(true);
        const userHistorySummary = generateUserHistorySummary(userDeliveredOrders, restaurants);
        try {
            const data = await getPersonalizedRecommendations({
                userHistory: userHistorySummary,
                currentLocation: 'Abidjan, Côte d\'Ivoire',
                timeOfDay: new Date().getHours() < 12 ? 'Matin' : new Date().getHours() < 18 ? 'Après-midi' : 'Soir',
            });
            setRecommendations(data);
        } catch (e) {
            console.error("Error fetching recommendations:", e);
            setRecommendations(null);
        } finally {
            setLoadingRecommendations(false);
        }
    };
    fetchRecommendations();
  }, [userDeliveredOrders, restaurants, isLoading]);
  
  React.useEffect(() => {
    // This is how we know an order was just placed from the cart
    const handleOrderPlaced = () => {
        setIsOrderPlaced(true);
        clearCart();
    };
    window.addEventListener('place-order', handleOrderPlaced);
    return () => window.removeEventListener('place-order', handleOrderPlaced);
  }, [clearCart]);


  const handleNewOrder = () => {
    setIsOrderPlaced(false);
  }
  
  const handleGenerateImages = async () => {
    toast({
      title: "Génération d'images en cours...",
      description: "Cela peut prendre quelques instants.",
    });
    try {
      await generateAllImages();
      toast({
        title: "Images générées !",
        description: "Les images des plats et restaurants ont été mises à jour.",
      });
    } catch (error) {
       console.error("Error generating images:", error);
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: "Impossible de générer les images pour le moment.",
      });
    }
  };

  const filteredRestaurants = React.useMemo(() => {
    if (!interpretedSearch && !searchQuery) return restaurants;
    
    let results = restaurants;
    
    if (searchQuery && !interpretedSearch) {
        results = restaurants.filter(restaurant => restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (interpretedSearch) {
        results = restaurants.filter(restaurant => {
            const matchesCuisine = interpretedSearch.cuisine?.length > 0 
                ? interpretedSearch.cuisine.some(c => restaurant.cuisine.toLowerCase().includes(c.toLowerCase())) 
                : true;
            
            const matchesRating = interpretedSearch.rating 
                ? restaurant.rating >= interpretedSearch.rating 
                : true;

            const matchesDeliveryTime = interpretedSearch.deliveryTime
                ? restaurant.deliveryTime <= interpretedSearch.deliveryTime
                : true;

            return matchesCuisine && matchesRating && matchesDeliveryTime;
        });
    }
    return results;
  }, [restaurants, searchQuery, interpretedSearch]);

  const filteredMenuItems = React.useMemo(() => {
     if (!interpretedSearch && !searchQuery) return menuItems;
     
     let results = menuItems;

     if (searchQuery && !interpretedSearch) {
        results = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()));
     }

    if (interpretedSearch) {
        results = menuItems.filter(item => {
            const allSearchTerms = [
                ...(interpretedSearch.keywords || []),
                ...(interpretedSearch.searchTerms || [])
            ].map(t => t.toLowerCase());

            const matchesSearchTerms = allSearchTerms.length > 0 ? allSearchTerms.some(term => 
                item.name.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term)
            ) : true;
            
            const matchesPrice = interpretedSearch.priceRange
                ? (item.price >= (interpretedSearch.priceRange.min || 0)) && (item.price <= (interpretedSearch.priceRange.max || Infinity))
                : true;

            return matchesSearchTerms && matchesPrice;
        });
    }
    return results;
  }, [menuItems, searchQuery, interpretedSearch]);


  if (isOrderPlaced) {
    return <OrderStatus onNewOrder={handleNewOrder} />;
  }
  
  const renderSkeletons = (count: number, type: 'restaurant' | 'menu') => (
    Array.from({ length: count }).map((_, i) => (
      <div key={`skeleton-${type}-${i}`} className="flex flex-col space-y-3">
        <Skeleton className={`w-full ${type === 'restaurant' ? 'h-[160px]' : 'h-[120px]'} rounded-xl`} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    ))
  );

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section>
          <SearchBar 
            onSearchChange={setSearchQuery} 
            onInterpretedSearchChange={setInterpretedSearch}
          />
      </section>

      <div>
        {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} />}

        <section className="mt-12 md:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">Restaurants Populaires</h2>
            <Button variant="link" className="text-primary hidden sm:block">Voir tout</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {isLoading ? renderSkeletons(3, 'restaurant') : filteredRestaurants.map(restaurant => (
              <div key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 md:mt-16">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-headline text-foreground">À la carte</h2>
             <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGenerateImages} disabled={isGenerating} size="sm">
                {isGenerating ? <Loader className="animate-spin" /> : <ImageIcon />}
                <span className="hidden sm:inline-block ml-2">Générer les images</span>
              </Button>
              <Button variant="link" className="text-primary hidden sm:block">Voir tout</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             {isLoading ? renderSkeletons(4, 'menu') : filteredMenuItems.map(item => (
              <div key={item.id}>
                <MenuItemCard item={item} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
