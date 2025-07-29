
'use client';

import * as React from 'react';
import { Pizza, Drumstick, Salad, Soup } from 'lucide-react';
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
import type { Order, Restaurant } from '@/lib/types';
import { Recommendations, RecommendationsSkeleton } from '../recommendations';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';

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
  const { restaurants, orders, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [showOrderStatus, setShowOrderStatus] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);

  const userDeliveredOrders = React.useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.uid && o.status === 'Livrée');
  }, [orders, user]);

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoadingRecommendations(false);
        return;
      };
      setLoadingRecommendations(true);
      const userHistorySummary = generateUserHistorySummary(userDeliveredOrders, restaurants);
      try {
        const data = await getPersonalizedRecommendations({
          userHistory: userHistorySummary,
          currentLocation: 'Abidjan, Côte d\'Ivoire',
          timeOfDay: new Date().getHours() < 12 ? 'Matin' : (new Date().getHours() < 18 ? 'Après-midi' : 'Soir'),
        });
        setRecommendations(data);
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setRecommendations(null);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    if (!isLoading) {
      fetchRecommendations();
    }
  }, [user, userDeliveredOrders, restaurants, isLoading]);

  React.useEffect(() => {
    if (user && orders.length > 0) {
      const userOrders = orders.filter(o => o.userId === user.uid).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestActiveOrder = userOrders.find(o => o.status !== 'Livrée' && o.status !== 'Annulée');
      if (latestActiveOrder) {
        setActiveOrder(latestActiveOrder);
        setShowOrderStatus(true);
      } else {
        setActiveOrder(null);
        setShowOrderStatus(false);
      }
    } else {
      setActiveOrder(null);
      setShowOrderStatus(false);
    }
  }, [orders, user]);

  React.useEffect(() => {
    const handlePlaceOrder = () => {
      setTimeout(() => {
        if (user && orders.length > 0) {
          const latestOrder = orders.filter(o => o.userId === user.uid).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (latestOrder) {
            setActiveOrder(latestOrder);
            setShowOrderStatus(true);
          }
        }
      }, 1000);
    };
    window.addEventListener('place-order', handlePlaceOrder);
    return () => window.removeEventListener('place-order', handlePlaceOrder);
  }, [orders, user]);

  const filteredRestaurants = React.useMemo(() => {
    let results = restaurants;
    if (searchQuery && !interpretedSearch) {
      return restaurants.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (interpretedSearch) {
      return restaurants.filter(r => {
        const matchesCuisine = interpretedSearch.cuisine?.length > 0 ? interpretedSearch.cuisine.some(c => r.cuisine.toLowerCase().includes(c.toLowerCase())) : true;
        const matchesRating = interpretedSearch.rating ? r.rating >= interpretedSearch.rating : true;
        const matchesDeliveryTime = interpretedSearch.deliveryTime ? r.deliveryTime <= interpretedSearch.deliveryTime : true;
        return matchesCuisine && matchesRating && matchesDeliveryTime;
      });
    }
    return results;
  }, [restaurants, searchQuery, interpretedSearch]);

  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => (
    <div key={`skeleton-resto-${i}`} className="flex flex-col space-y-3">
      <Skeleton className="h-[160px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ));

  if (showOrderStatus && activeOrder) {
    return <OrderStatus order={activeOrder} onNewOrder={() => setShowOrderStatus(false)} />;
  }

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <section className="text-center bg-card p-8 md:p-12 rounded-2xl shadow-lg">
        <h1 className="text-4xl md:text-6xl font-headline text-primary">Votre ville, livrée.</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Les meilleurs plats des restaurants de Yamoussoukro, directement chez vous. Simple, rapide et délicieux.
        </p>
        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar onSearchChange={setSearchQuery} onInterpretedSearchChange={setInterpretedSearch} />
        </div>
      </section>

      {loadingRecommendations ? <RecommendationsSkeleton /> : <Recommendations recommendationsData={recommendations} />}

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
          <h2 className="text-2xl md:text-3xl font-headline text-foreground">Restaurants</h2>
          <Button variant="link" className="text-primary hidden sm:block">Voir tout</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading ? renderSkeletons(6) : filteredRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
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
