import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Clock, Bike, MapPin } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getPlaceholderImage } from '@/lib/placeholder-images';

interface RestaurantCardProps {
  restaurant: Restaurant;
  featured?: boolean;
  matchReason?: string;
  distance?: number;
}

export function RestaurantCard({ restaurant, featured = false, matchReason, distance }: RestaurantCardProps) {
  const placeholder = getPlaceholderImage(restaurant.indiceImage);
  const imageSrc = (restaurant.image && restaurant.image !== "" && !restaurant.image.includes('picsum.photos'))
    ? restaurant.image
    : placeholder.url;

  const isCloudinary = imageSrc.includes('res.cloudinary.com');

  return (
    <Link href={`/restaurants?id=${restaurant.id}`}>
      <Card className={cn(
        "overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group h-full flex flex-col rounded-2xl",
        featured && "border-2 border-primary/50 bg-primary/5"
      )}>
        <CardHeader className="p-0 relative h-40">
          {isCloudinary ? (
            <CldImage
              src={imageSrc}
              alt={restaurant.nom || ''}
              width={placeholder.width}
              height={placeholder.height}
              crop="fill"
              gravity="auto"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={restaurant.nom || ''}
              width={placeholder.width}
              height={placeholder.height}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={restaurant.indiceImage}
            />
          )}
          {featured && <Badge className="absolute top-2 right-2" variant="default">En vedette</Badge>}
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="text-lg font-bold font-headline truncate">{restaurant.nom}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
            {matchReason && (
              <p className="text-xs text-primary font-semibold mt-1 italic">{matchReason}</p>
            )}
            {distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 font-semibold">
                <MapPin className="w-3 h-3" />
                <span>{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>
              </div>
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
