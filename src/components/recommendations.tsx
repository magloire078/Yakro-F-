'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Button } from './ui/button';
import { Star, AlertTriangle, Sparkles, ShoppingBag, BrainCircuit } from 'lucide-react';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Skeleton } from './ui/skeleton';
import { useCart } from '@/contexts/cart-context';
import type { CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

interface RecommendationsProps {
  recommendationsData: PersonalizedRecommendationsOutput | null;
  hasError: boolean;
  isCarousel?: boolean;
}

export function Recommendations({ recommendationsData, hasError, isCarousel = true }: RecommendationsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { menuItems } = useData();

  if (hasError) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] backdrop-blur-sm"
      >
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-600 mb-2">Service intelligent en pause</h3>
        <p className="text-muted-foreground max-w-md mx-auto">Notre IA locale se repose un instant. Vos recommandations habituelles reviennent bientôt.</p>
      </motion.div>
    );
  }

  if (!recommendationsData || !recommendationsData.recommendations || recommendationsData.recommendations.length === 0) {
    return null;
  }

  const handleAddToCart = (recommendedItemName: string) => {
    const menuItem = menuItems.find(item => item && item.nom && item.nom.toLowerCase() === recommendedItemName.toLowerCase());
    if (menuItem) {
      const cartItem: CartItem = {
        ...menuItem,
        quantite: 1,
      };
      addToCart(cartItem);
      toast({
        title: "Ajouté au panier",
        description: `${menuItem.nom} a été ajouté à votre panier.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Article non disponible",
        description: "Désolé, cet article n'est pas disponible pour le moment.",
      });
    }
  };

  const RecommendationCard = ({ rec, index }: { rec: NonNullable<PersonalizedRecommendationsOutput['recommendations']>[number], index: number }) => {
    const menuItem = menuItems.find(item => item && item.nom && item.nom.toLowerCase() === rec.item.toLowerCase());
    const placeholder = getPlaceholderImage(menuItem?.indiceImage || rec.cuisine);
    const imageSrc = menuItem?.image && !menuItem.image.includes('picsum.photos') ? menuItem.image : placeholder.url;

    const isCloudinary = imageSrc.includes('res.cloudinary.com');

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="h-full"
      >
        <Card className="group relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-primary/40 transition-all duration-300 h-full flex flex-col rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl">
          <CardHeader className="p-0 relative h-36 xs:h-40 sm:h-44 md:h-48 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 z-10" />
            {isCloudinary ? (
              <CldImage
                src={imageSrc}
                alt={rec.item || 'plat recommandé'}
                width={placeholder.width}
                height={placeholder.height}
                crop="fill"
                gravity="auto"
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Image
                src={imageSrc}
                alt={rec.item || 'plat recommandé'}
                width={placeholder.width}
                height={placeholder.height}
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                data-ai-hint={`${rec.cuisine} food`}
              />
            )}
            <Badge className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 bg-primary/95 backdrop-blur-md border-none shadow-md text-[9px] xs:text-[10px] sm:text-xs py-0.5 px-2">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 fill-white" /> Recommandé
            </Badge>
            <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-20">
               <span className="text-white font-bold text-sm xs:text-base sm:text-lg leading-tight drop-shadow-md">{rec.item}</span>
            </div>
          </CardHeader>
          <CardContent className="p-3 xs:p-3.5 sm:p-4 md:p-5 flex flex-col flex-grow relative justify-between">
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5 flex-grow">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">{rec.cuisine}</span>
                  <div className="flex items-center gap-1 text-xs sm:text-sm font-bold">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>{menuItem?.prix ? menuItem.prix.toLocaleString('fr-FR') : '---'} <small className="text-[8px] xs:text-[9px] font-normal">FCFA</small></span>
                  </div>
               </div>
               
               <p className="text-[11px] xs:text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal italic line-clamp-2">
                 &ldquo;{rec.description}&rdquo;
               </p>

               <div className="flex items-center gap-1.5 pt-0.5 text-[9px] xs:text-[10px] text-slate-400">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
                  <span>Préféré des gourmets</span>
               </div>
            </div>

            <Button 
                className="w-full mt-2.5 xs:mt-3 sm:mt-4 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-orange-500 hover:bg-primary/90 dark:hover:bg-orange-400 text-white font-bold h-8 xs:h-9 sm:h-11 text-xs sm:text-sm gap-1.5 shadow-md active:scale-95 transition-all"
                onClick={() => handleAddToCart(rec.item)}
            >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Commander
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <section className="w-full py-2 sm:py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
               <BrainCircuit className="h-3.5 w-3.5" />
               Personnalisé par Yakro AI
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-headline text-foreground">Rien que pour vous</h2>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-sm italic line-clamp-1 md:line-clamp-none">
            &ldquo;Basé sur vos préférences et découvertes culinaires.&rdquo;
        </p>
      </div>

      {isCarousel ? (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {recommendationsData.recommendations.map((rec, index) => (
              <CarouselItem key={index} className="pl-3 sm:pl-4 basis-[82%] sm:basis-1/2 lg:basis-1/3">
                <RecommendationCard rec={rec} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-end gap-2 mt-4">
            <CarouselPrevious className="relative inset-0 translate-y-0 h-10 w-10 rounded-xl border-slate-200" />
            <CarouselNext className="relative inset-0 translate-y-0 h-10 w-10 rounded-xl border-slate-200 bg-slate-900 text-white hover:bg-slate-800" />
          </div>
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {recommendationsData.recommendations.map((rec, index) => (
            <RecommendationCard key={index} rec={rec} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}

export function RecommendationsSkeleton() {
  const SkeletonCard = () => (
    <div className="p-1 h-full">
      <Card className="h-[400px] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-0">
          <Skeleton className="h-48 w-full" />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
             <Skeleton className="h-4 w-20" />
             <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full mt-4 rounded-2xl" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="w-full py-8">
      <div className="space-y-4 mb-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  )
}
