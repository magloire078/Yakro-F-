

'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import Image from 'next/image';
import { Button } from './ui/button';
import { Star } from 'lucide-react';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Skeleton } from './ui/skeleton';
import { useCart } from '@/contexts/cart-context';
import type { MenuItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';

interface RecommendationsProps {
  recommendationsData: PersonalizedRecommendationsOutput | null;
  isCarousel?: boolean;
}

export function Recommendations({ recommendationsData, isCarousel = true }: RecommendationsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { menuItems, getMenuItem } = useData();

  if (!recommendationsData || recommendationsData.recommendations.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4 bg-card rounded-lg">
            <Star className="w-16 h-16"/>
            <p className="text-lg font-medium">Pas de recommandations pour le moment</p>
            <p>Commandez quelques plats pour que notre IA apprenne à vous connaître !</p>
        </div>
    );
  }

  const handleAddToCart = (recommendedItemName: string) => {
    const menuItem = menuItems.find(item => item.name.toLowerCase() === recommendedItemName.toLowerCase());
    if (menuItem) {
      addToCart(menuItem);
      toast({
        title: "Ajouté au panier",
        description: `${menuItem.name} a été ajouté à votre panier.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Article non disponible",
        description: "Désolé, cet article n'est pas disponible pour le moment.",
      });
    }
  };
  
  const RecommendationCard = ({ rec, index }: { rec: any, index: number}) => {
    const menuItem = menuItems.find(item => item.name.toLowerCase() === rec.item.toLowerCase());
    const imageSrc = menuItem ? getMenuItem(menuItem.id)?.image : `https://placehold.co/600x400`;
    
    return (
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
            <CardHeader className="p-0">
              <Image
                  src={imageSrc || 'https://placehold.co/600x400'}
                  alt={rec.item}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={`${rec.cuisine} food`}
                />
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-lg font-headline">{rec.item}</h3>
              <p className="text-sm text-muted-foreground">{rec.restaurant} - {rec.cuisine}</p>
              <p className="text-sm my-2 h-10 flex-grow">{rec.description}</p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                    <span className="text-sm font-bold">{menuItem?.price ? menuItem.price.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</span>
                </div>
                <Button size="sm" variant="outline" className="text-primary border-primary" onClick={() => handleAddToCart(rec.item)}>Ajouter</Button>
              </div>
            </CardContent>
          </Card>
    )
  }

  if (isCarousel) {
      return (
        <section className="w-full">
          <h2 className="text-3xl font-headline text-foreground mb-6">Pour Vous</h2>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {recommendationsData.recommendations.map((rec, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                       <RecommendationCard rec={rec} index={index} />
                    </div>
                  </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="text-primary" />
            <CarouselNext className="text-primary" />
          </Carousel>
        </section>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {recommendationsData.recommendations.map((rec, index) => (
            <RecommendationCard key={index} rec={rec} index={index} />
        ))}
    </div>
  )
}

export function RecommendationsSkeleton() {
  const SkeletonCard = () => (
    <div className="p-1">
       <Card className="h-full">
            <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
                 <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-1/3" />
                </div>
            </CardContent>
        </Card>
    </div>
  );

  return (
     <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  )
}
