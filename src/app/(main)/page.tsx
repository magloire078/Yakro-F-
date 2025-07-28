

'use client';

import * as React from 'react';
import { UtensilsCrossed, Image as ImageIcon, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { MenuItemCard } from '@/components/menu-item-card';
import { OrderStatus } from '@/components/order-status';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import { SearchBar } from '@/components/search-bar';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';


export default function Home() {
  const { clearCart } = useCart();
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

            if (!item || !item.name || !item.description) return false;

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
