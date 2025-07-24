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

interface RecommendationsProps {
  recommendationsData: PersonalizedRecommendationsOutput | null;
  menuItems: MenuItem[];
}

export function Recommendations({ recommendationsData, menuItems }: RecommendationsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!recommendationsData || recommendationsData.recommendations.length === 0) {
    return null;
  }

  const handleAddToCart = (recommendedItemName: string) => {
    const menuItem = menuItems.find(item => item.name === recommendedItemName);
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
              <div className="p-1">
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="p-0">
                     <Image
                        src={`https://placehold.co/600x400`}
                        alt={rec.item}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                        data-ai-hint={`${rec.cuisine} food`}
                      />
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg font-headline">{rec.item}</h3>
                    <p className="text-sm text-muted-foreground">{rec.restaurant} - {rec.cuisine}</p>
                    <p className="text-sm my-2 h-10">{rec.description}</p>
                     <div className="flex justify-between items-center mt-4">
                       <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                          <span className="text-sm font-bold">4.7</span>
                       </div>
                       <Button size="sm" variant="outline" className="text-primary border-primary" onClick={() => handleAddToCart(rec.item)}>Ajouter</Button>
                    </div>
                  </CardContent>
                </Card>
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

export function RecommendationsSkeleton() {
  return (
     <section className="w-full">
      <h2 className="text-3xl font-headline text-foreground mb-6"><Skeleton className="h-8 w-48" /></h2>
      <div className="flex space-x-4">
        <div className="w-1/3">
            <Skeleton className="h-64 w-full" />
        </div>
        <div className="w-1/3">
            <Skeleton className="h-64 w-full" />
        </div>
        <div className="w-1/3">
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </section>
  )
}
