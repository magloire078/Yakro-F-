
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { getPersonalizedRecommendations, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Recommendations as RecommendationsComponent, RecommendationsSkeleton } from '@/components/recommendations';
import { Loader, UserX } from 'lucide-react';
import type { Order, Restaurant, MenuItem } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    order.plats.forEach(item => {
      itemCount[item.nom] = (itemCount[item.nom] || 0) + item.quantite;
    });
  });
  
  const favoriteCuisine = Object.keys(cuisineCount).length > 0 
    ? Object.keys(cuisineCount).reduce((a, b) => cuisineCount[a] > cuisineCount[b] ? a : b, '')
    : 'inconnue';
  
  const favoriteItems = Object.entries(itemCount)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5)
    .map(item => item[0]);

  return `L'utilisateur a passé ${orders.length} commandes pour un total de ${totalSpent.toLocaleString('fr-FR')} FCFA. Sa cuisine préférée semble être ${favoriteCuisine}. Il commande fréquemment les plats suivants : ${favoriteItems.join(', ')}. Base tes recommandations sur ses préférences et la popularité des plats.`;
}

export default function RecommendationsPage() {
    const { user, loading: authLoading } = useAuth();
    const { orders, restaurants, menuItems, isLoading: dataLoading } = useData();

    const [recommendations, setRecommendations] = React.useState<PersonalizedRecommendationsOutput | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    
    const userDeliveredOrders = React.useMemo(() => {
        if (!user) return [];
        return orders.filter(o => o.userId === user.uid && o.statut === 'Livrée');
    }, [orders, user]);

    React.useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user || dataLoading || menuItems.length === 0 || restaurants.length === 0) {
                setLoadingRecommendations(false);
                return;
            };
            
            setLoadingRecommendations(true);
            setHasError(false);
            const userHistorySummary = generateUserHistorySummary(userDeliveredOrders, restaurants);
            
            const availableMenuItems = menuItems.map(item => {
                const restaurant = restaurants.find(r => r.id === item.restaurantId);
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
                const data = await getPersonalizedRecommendations({
                    userHistory: userHistorySummary,
                    availableMenuItems: availableMenuItems,
                    currentLocation: 'Abidjan, Côte d\'Ivoire',
                    timeOfDay: new Date().getHours() < 12 ? 'Matin' : (new Date().getHours() < 18 ? 'Après-midi' : 'Soir'),
                });
                setRecommendations(data);
            } catch (e) {
                console.error("Error fetching recommendations:", e);
                setHasError(true);
                setRecommendations(null);
            } finally {
                setLoadingRecommendations(false);
            }
        };

        if (!authLoading && !dataLoading) {
            fetchRecommendations();
        }
    }, [user, userDeliveredOrders, restaurants, menuItems, dataLoading, authLoading]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
         return (
             <div className="flex h-full w-full flex-col items-center justify-center text-center gap-4">
                <UserX className="w-16 h-16 text-muted-foreground"/>
                <p className="text-lg font-medium">Connectez-vous pour des recommandations personnalisées</p>
                <p className="text-muted-foreground">Nous ne pouvons pas vous suggérer de plats sans savoir qui vous êtes !</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Se connecter</Link>
                </Button>
            </div>
         )
    }


    return (
        <div className="container mx-auto">
             <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-headline text-primary">Spécialement Pour Vous</h1>
                <p className="text-muted-foreground mt-2">Des plats et restaurants choisis par notre IA, juste pour vos papilles.</p>
            </div>
            {loadingRecommendations ? <RecommendationsSkeleton /> : <RecommendationsComponent recommendationsData={recommendations} hasError={hasError} isCarousel={false} />}
        </div>
    );
}
