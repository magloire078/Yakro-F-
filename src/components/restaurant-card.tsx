import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Star, Clock, Bike, MapPin, ChevronRight } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { motion } from 'framer-motion';

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
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Link href={`/restaurants?id=${restaurant.id}`} className="block h-full">
        <Card className={cn(
          "overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer group h-full flex flex-col rounded-2xl sm:rounded-3xl",
          featured && "border-primary/30 bg-primary/[0.03]"
        )}>
          <CardHeader className="p-0 relative h-36 xs:h-40 sm:h-44 md:h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            
            {isCloudinary ? (
              <CldImage
                src={imageSrc}
                alt={restaurant.nom || ''}
                width={placeholder.width}
                height={placeholder.height}
                crop="fill"
                gravity="auto"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <Image
                src={imageSrc}
                alt={restaurant.nom || ''}
                width={placeholder.width}
                height={placeholder.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
                data-ai-hint={restaurant.indiceImage}
              />
            )}
            
            <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 flex flex-wrap gap-1.5">
                {featured && (
                    <Badge className="bg-primary hover:bg-primary/90 border-none px-2 sm:px-2.5 py-0.5 text-[9px] xs:text-[10px] sm:text-xs shadow-md shadow-primary/20">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 fill-white" /> En vedette
                    </Badge>
                )}
                 <Badge className="bg-white/95 dark:bg-slate-900/95 text-foreground border-none backdrop-blur-md px-2 py-0.5 text-[9px] xs:text-[10px] sm:text-xs flex items-center gap-1 w-fit shadow-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{restaurant.note}</span>
                </Badge>
            </div>

            {distance !== undefined && (
              <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[9px] xs:text-[10px] sm:text-xs font-semibold border border-white/10">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                <span>{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-3 xs:p-3.5 sm:p-4 md:p-5 flex-grow flex flex-col justify-between">
            <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm xs:text-base sm:text-lg font-bold font-headline group-hover:text-primary transition-colors duration-200 line-clamp-1">{restaurant.nom}</h3>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-0.5" />
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-2 py-0 text-[9px] xs:text-[10px] sm:text-xs">
                    {restaurant.cuisine}
                </Badge>
                {matchReason && (
                   <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 dark:bg-orange-950/30 text-primary dark:text-orange-400 text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-primary/10 dark:border-orange-900/50">
                     ✨ {matchReason}
                   </div>
                )}
              </div>
            </div>

            <div className="mt-2.5 xs:mt-3 sm:mt-4 pt-2 xs:pt-2.5 sm:pt-3 flex items-center justify-between text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 text-[11px] xs:text-xs sm:text-sm">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{restaurant.tempsDeLivraison} min</span>
                </div>

                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />

                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 text-[11px] xs:text-xs sm:text-sm">
                  <Bike className="w-3 h-3 text-emerald-500" />
                  <span>{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} F` : 'Gratuit'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
