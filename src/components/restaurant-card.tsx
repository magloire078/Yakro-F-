import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Clock, Bike } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
  matchReason?: string;
}

export function RestaurantCard({ restaurant, featured = false, matchReason }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card className={cn(
        "overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group h-full flex flex-col",
        featured && "border-2 border-primary/50 bg-primary/5"
      )}>
        <CardHeader className="p-0 relative h-40">
          <Image
            src={restaurant.image}
            alt={restaurant.nom}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={restaurant.indiceImage}
          />
           {featured && <Badge className="absolute top-2 right-2" variant="default">En vedette</Badge>}
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="text-lg font-bold font-headline truncate">{restaurant.nom}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
            {matchReason && (
              <p className="text-xs text-primary font-semibold mt-1 italic">{matchReason}</p>
            )}
          </div>
          <div className="flex justify-between items-center mt-3 text-sm pt-2 border-t">
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{restaurant.note}</span>
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{restaurant.tempsDeLivraison} min</span>
            </div>
             <div className="flex items-center gap-1 text-muted-foreground">
              <Bike className="w-4 h-4" />
              <span>{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
