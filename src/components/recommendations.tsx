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
        <Card className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 hover:border-orange-500/40 transition-all duration-500 h-full flex flex-col rounded-[2.5rem] shadow-sm hover:shadow-2xl">
          <CardHeader className="p-0 relative h-48 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
            {isCloudinary ? (
              <CldImage
                src={imageSrc}
                alt={rec.item || 'plat recommandé'}
                width={placeholder.width}
                height={placeholder.height}
                crop="fill"
                gravity="auto"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <Image
                src={imageSrc}
                alt={rec.item || 'plat recommandé'}
                width={placeholder.width}
                height={placeholder.height}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                data-ai-hint={`${rec.cuisine} food`}
              />
            )}
            <Badge className="absolute top-4 right-4 z-20 bg-orange-500/90 backdrop-blur-md border-none shadow-lg">
                <Sparkles className="w-3 h-3 mr-1 fill-white" /> Recommandé
            </Badge>
            <div className="absolute bottom-4 left-4 z-20">
               <span className="text-white font-bold text-lg leading-tight drop-shadow-md">{rec.item}</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col flex-grow relative">
            <div className="space-y-4 flex-grow">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{rec.cuisine}</span>
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{menuItem?.prix ? menuItem.prix.toLocaleString('fr-FR') : '---'} <small className="text-[10px] font-normal">FCFA</small></span>
                  </div>
               </div>
               
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-2">
                 &ldquo;{rec.description}&rdquo;
               </p>

               <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
                  <span>Aimé par d&apos;autres gourmets</span>
               </div>
            </div>

            <Button 
                className="w-full mt-6 rounded-2xl bg-slate-900 dark:bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white font-bold h-12 gap-2 shadow-lg shadow-orange-500/10"
                onClick={() => handleAddToCart(rec.item)}
            >
                <ShoppingBag className="w-4 h-4" /> Commander
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <section className="w-full py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">
               <BrainCircuit className="h-4 w-4" />
               Personnalisé par Yakro-Fê AI
            </div>
            <h2 className="text-3xl md:text-4xl font-headline text-foreground">Rien que pour vous</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-sm italic">
            &ldquo;Basé sur vos préférences pour la cuisine ivoirienne et vos dernières découvertes.&rdquo;
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
          <CarouselContent className="-ml-4">
            {recommendationsData.recommendations.map((rec, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <RecommendationCard rec={rec} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-end gap-2 mt-6">
            <CarouselPrevious className="relative inset-0 translate-y-0 h-12 w-12 rounded-2xl border-slate-200" />
            <CarouselNext className="relative inset-0 translate-y-0 h-12 w-12 rounded-2xl border-slate-200 bg-slate-900 text-white hover:bg-slate-800" />
          </div>
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
