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
  { id: '1', name: 'Le Pili Pili', cuisine: 'Ivorian', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/600x400', imageHint: 'african food' },
  { id: '2', name: 'Pizza Bella', cuisine: 'Italian', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
  { id: '3', name: 'Sushi House', cuisine: 'Japanese', rating: 4.7, deliveryTime: 40, image: 'https://placehold.co/600x400', imageHint: 'sushi' },
  { id: '4', name: 'Burger Queen', cuisine: 'American', rating: 4.5, deliveryTime: 20, image: 'https://placehold.co/600x400', imageHint: 'burger' },
];

const initialMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Poulet Braisé', description: 'Poulet grillé mariné aux épices locales.', price: 12.50, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken' },
  { id: 'm2', name: 'Pizza Margherita', description: 'Classique tomate, mozzarella, basilic.', price: 14.00, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
  { id: 'm3', name: 'Combo Sushi', description: 'Assortiment de 16 sushis et makis.', price: 25.00, image: 'https://placehold.co/600x400', imageHint: 'sushi platter' },
  { id: 'm4', name: 'Classic Cheeseburger', description: 'Boeuf, cheddar, laitue, tomate, oignons.', price: 9.50, image: 'https://placehold.co/600x400', imageHint: 'cheeseburger' },
  { id: 'm5', name: 'Attiéké Poisson', description: 'Semoule de manioc avec poisson frit.', price: 15.00, image: 'https://placehold.co/600x400', imageHint: 'african dish' },
  { id: 'm6', name: 'Tiramisu', description: 'Dessert italien crémeux au café.', price: 7.00, image: 'https://placehold.co/600x400', imageHint: 'tiramisu' },
];

export default function Home() {
  const [isOrderPlaced, setIsOrderPlaced] = React.useState(false);
  const { clearCart } = useCart();
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
  
  const [restaurants] = React.useState<Restaurant[]>(initialRestaurants);
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
      toast({
        title: "Images générées !",
        description: "Les images des plats ont été mises à jour.",
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
    <div className="flex flex-col items-center">
      <section className="w-full bg-primary/10 py-12 md:py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-headline text-primary mb-4">Yakro Fê</h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Votre ville, livrée. Restaurants et supermarchés à votre porte en quelques minutes.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Chercher un restaurant ou un produit..."
              className="w-full rounded-full p-3 pl-10 text-base bg-card border-2 border-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} menuItems={menuItems} />}

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">Restaurants Populaires</h2>
            <Button variant="link" className="text-primary">Voir tout</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="mt-16">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-headline text-foreground">Plats du Jour</h2>
             <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGenerateImages} disabled={isGeneratingImages}>
                {isGeneratingImages ? <Loader className="animate-spin" /> : <ImageIcon />}
                Générer les images
              </Button>
              <Button variant="link" className="text-primary">Voir tout</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {menuItems.slice(0, 6).map(item => (
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
