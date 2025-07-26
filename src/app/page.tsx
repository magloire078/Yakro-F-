
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
import { useData, getRestaurantsForHistory, useOrders } from '@/contexts/data-context';
import { pastOrders } from '@/lib/data';
import type { Order } from '@/lib/types';
import { SearchBar } from '@/components/search-bar';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';


// Helper function to generate user history summary
const generateUserHistorySummary = (orders: Order[]): string => {
  const cuisineCount: { [key: string]: number } = {};
  const itemCount: { [key: string]: number } = {};
  let totalSpent = 0;
  let deliveredOrders = 0;

  orders.forEach(order => {
    if (order.status === 'Livrée') {
      deliveredOrders++;
      totalSpent += order.total;
      order.items.forEach(item => {
        // We need to find the restaurant to get the cuisine
        const restaurant = getRestaurantsForHistory().find(r => r.id === item.restaurantId);
        if (restaurant) {
          cuisineCount[restaurant.cuisine] = (cuisineCount[restaurant.cuisine] || 0) + 1;
        }
        itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
      });
    }
  });
  
  const favoriteCuisine = Object.keys(cuisineCount).reduce((a, b) => cuisineCount[a] > cuisineCount[b] ? a : b, '');
  const favoriteItems = Object.entries(itemCount).sort((a,b) => b[1] - a[1]).slice(0,3).map(item => item[0]);

  return `The user has placed ${deliveredOrders} orders. They have spent a total of ${totalSpent} FCFA. Their favorite cuisine seems to be ${favoriteCuisine}. They frequently order the following items: ${favoriteItems.join(', ')}.`;
}


export default function Home() {
  const { cartItems, clearCart } = useCart();
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
    fetchData,
  } = useData();
  
  // Start listening for order updates if the user is logged in
  useOrders();

  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const userHistorySummary = generateUserHistorySummary(pastOrders);
    setLoadingRecommendations(true);
    getPersonalizedRecommendations({
      userHistory: userHistorySummary,
      currentLocation: 'Abidjan, Ivory Coast',
      timeOfDay: 'Diner',
    })
      .then(data => {
        setRecommendations(data);
      })
      .catch(e => {
        console.error("Error fetching recommendations:", e);
        setRecommendations(null);
      })
      .finally(() => {
        setLoadingRecommendations(false);
      });
  }, []);
  
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
    if (!interpretedSearch) {
       return restaurants.filter(restaurant => restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return restaurants.filter(restaurant => {
        // AI-powered search filters
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
  }, [restaurants, searchQuery, interpretedSearch]);

  const filteredMenuItems = React.useMemo(() => {
     if (!interpretedSearch) {
       return menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return menuItems.filter(item => {
        // AI-powered search filters
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
  }, [menuItems, searchQuery, interpretedSearch]);


  if (isOrderPlaced) {
    return <OrderStatus onNewOrder={handleNewOrder} />;
  }
  
  const renderSkeletons = (count: number, type: 'restaurant' | 'menu') => (
    Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col space-y-3">
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
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
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
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
