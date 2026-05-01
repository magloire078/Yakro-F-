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
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Link href={`/restaurants?id=${restaurant.id}`} className="block h-full">
        <Card className={cn(
          "overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:border-orange-500/30 transition-all duration-500 cursor-pointer group h-full flex flex-col rounded-[2rem]",
          featured && "border-orange-500/20 bg-orange-500/[0.02]"
        )}>
          <CardHeader className="p-0 relative h-52 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            
            {isCloudinary ? (
              <CldImage
                src={imageSrc}
                alt={restaurant.nom || ''}
                width={placeholder.width}
                height={placeholder.height}
                crop="fill"
                gravity="auto"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            ) : (
              <Image
                src={imageSrc}
                alt={restaurant.nom || ''}
                width={placeholder.width}
                height={placeholder.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out"
                data-ai-hint={restaurant.indiceImage}
              />
            )}
            
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {featured && (
                    <Badge className="bg-orange-500 hover:bg-orange-600 border-none px-3 py-1 shadow-lg shadow-orange-500/20">
                        <Star className="w-3 h-3 mr-1 fill-white" /> En vedette
                    </Badge>
                )}
                 <Badge className="bg-white/90 dark:bg-slate-900/90 text-foreground border-none backdrop-blur-md px-2 py-1 flex items-center gap-1.5 w-fit shadow-md">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{restaurant.note}</span>
                </Badge>
            </div>

            {distance !== undefined && (
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 flex-grow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-xl font-bold font-headline group-hover:text-orange-500 transition-colors duration-300">{restaurant.nom}</h3>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-2 py-0">
                    {restaurant.cuisine}
                </Badge>
                {matchReason && (
                   <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-100 dark:border-orange-900/50">
                     ✨ {matchReason}
                   </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-sm py-4 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Temps</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>{restaurant.tempsDeLivraison} min</span>
                  </div>
                </div>

                <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/50 pl-5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Livraison</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <Bike className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
