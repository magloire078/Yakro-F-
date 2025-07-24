
'use client';

import * as React from 'react';
import { Search, UtensilsCrossed, Image as ImageIcon, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { MenuItemCard } from '@/components/menu-item-card';
import { Recommendations, RecommendationsSkeleton } from '@/components/recommendations';
import { OrderStatus } from '@/components/order-status';
import type { Restaurant, MenuItem } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';

const initialRestaurants: Restaurant[] = [
    { id: '1', name: 'Le Pili Pili', cuisine: 'Ivoirienne', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/600x400', imageHint: 'african food' },
    { id: '2', name: 'Chez Mario', cuisine: 'Pizza', rating: 4.7, deliveryTime: 35, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
    { id: '3', name: 'Le Bazin', cuisine: 'Africaine', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'traditional african food' },
    { id: '4', name: 'La Brise du Lac', cuisine: 'Grillades', rating: 4.5, deliveryTime: 40, image: 'https://placehold.co/600x400', imageHint: 'lake view' },
];

const initialMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Poulet Braisé', description: 'Poulet entier grillé, mariné aux épices locales.', price: 7500, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken' },
    { id: 'm2', name: 'Foutou Banane, Sauce Graine', description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', price: 5000, image: 'https://placehold.co/600x400', imageHint: 'fufu palm nut soup' },
    { id: 'm3', name: 'Attiéké Poisson Thon', description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', price: 3500, image: 'https://placehold.co/600x400', imageHint: 'attieke fried fish' },
    { id: 'm4', name: 'Kedjenou de Poulet', description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', price: 6000, image: 'https://placehold.co/600x400', imageHint: 'chicken stew' },
    { id: 'm5', name: 'Alloco', description: 'Bananes plantains mûres frites, un délice sucré-salé.', price: 1500, image: 'https://placehold.co/600x400', imageHint: 'fried plantain' },
    { id: 'm6', name: 'Pizza Reine', description: 'Pizza garnie de jambon, champignons et fromage.', price: 8000, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
];

export default function Home() {
  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);
  const { clearCart } = useCart();
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>(initialRestaurants);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>(initialMenuItems);
  const [isGeneratingImages, setIsGeneratingImages] = React.useState(false);
  const { toast } = useToast();


  React.useEffect(() => {
    setLoadingRecommendations(true);
    getPersonalizedRecommendations({
      userHistory: 'Loves Ivorian food, spicy dishes, and has ordered pizza twice this month.',
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

  const handlePlaceOrder = () => {
    setIsOrderPlaced(true);
    clearCart();
  };

  const handleNewOrder = () => {
    setIsOrderPlaced(false);
  }
  
  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    toast({
      title: "Génération d'images en cours...",
      description: "Cela peut prendre quelques instants.",
    });

    try {
      const updatedMenuItems = await Promise.all(
        menuItems.map(async (item) => {
          const { imageUrl } = await generateImage({ prompt: item.name });
          return { ...item, image: imageUrl };
        })
      );
      setMenuItems(updatedMenuItems);
      
      const updatedRestaurants = await Promise.all(
        restaurants.map(async (resto) => {
          const { imageUrl } = await generateImage({ prompt: resto.cuisine });
          return { ...resto, image: imageUrl };
        })
      );
      setRestaurants(updatedRestaurants);

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
    } finally {
      setIsGeneratingImages(false);
    }
  };


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
            />
          </div>
      </section>

      <div>
        {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} menuItems={menuItems} />}

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">Restaurants Populaires</h2>
            <Button variant="link" className="text-primary">Voir tout</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="mt-16">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">À la carte</h2>
             <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGenerateImages} disabled={isGeneratingImages}>
                {isGeneratingImages ? <Loader className="animate-spin" /> : <ImageIcon />}
                Générer les images
              </Button>
              <Button variant="link" className="text-primary">Voir tout</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {menuItems.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
      {/* This is a hidden prop to trigger order status for demonstration */}
      <button onClick={handlePlaceOrder} className="hidden" id="placeOrderTrigger">Place Order</button>
    </div>
  );
}
