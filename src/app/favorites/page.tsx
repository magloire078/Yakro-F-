'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant-card';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useFavorites } from '@/hooks/use-favorites';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { restaurants, isLoading } = useData();
  const { favorites } = useFavorites();

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center py-16">
        <div>
          <p className="text-lg font-medium text-muted-foreground">Veuillez vous connecter pour voir vos favoris.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  const favRestaurants = restaurants.filter(r => r && favorites.includes(r.id));

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-7 h-7 text-red-500 fill-red-500" />
        <h1 className="text-2xl md:text-3xl font-headline text-primary">Mes restaurants favoris</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] w-full rounded-xl" />
          ))}
        </div>
      ) : favRestaurants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
          <Heart className="w-16 h-16" />
          <p className="text-lg font-medium">Aucun favori pour le moment</p>
          <p>Cliquez sur le cœur d'un restaurant pour l'ajouter à vos favoris.</p>
          <Button asChild className="mt-4">
            <Link href="/">Découvrir les restaurants</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {favRestaurants.map(r => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
