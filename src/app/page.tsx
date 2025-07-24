
'use client';

import * as React from 'react';
import { Search, UtensilsCrossed, Image as ImageIcon, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { MenuItemCard } from '@/components/menu-item-card';
import { Recommendations, RecommendationsSkeleton } from '@/components/recommendations';
import { OrderStatus } from '@/components/order-status';
import { useCart } from '@/contexts/cart-context';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';
import { useImages } from '@/contexts/image-context';
import { pastOrders } from '@/lib/data';
import type { Order } from '@/lib/types';


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
        const restaurant = useImages.getState().restaurants.find(r => r.id === item.restaurantId);
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
  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);
  const { clearCart } = useCart();
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  
  const { 
    restaurants, 
    menuItems, 
    isGenerating, 
    generateAllImages 
  } = useImages();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');


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
    // This is a bit of a hack to be able to trigger the order status from the cart sheet
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isOrderPlaced) {
    return <OrderStatus onNewOrder={handleNewOrder} />;
  }

  return (
    <div className="flex flex-col gap-12">
      <section>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Chercher un restaurant ou un produit..."
              className="w-full rounded-full p-3 pl-10 text-base bg-card border-2 border-primary/20 focus:border-primary"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
      </section>

      <div>
        {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} />}

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">Restaurants Populaires</h2>
            <Button variant="link" className="text-primary">Voir tout</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="mt-16">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">À la carte</h2>
             <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGenerateImages} disabled={isGenerating}>
                {isGenerating ? <Loader className="animate-spin" /> : <ImageIcon />}
                Générer les images
              </Button>
              <Button variant="link" className="text-primary">Voir tout</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredMenuItems.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
