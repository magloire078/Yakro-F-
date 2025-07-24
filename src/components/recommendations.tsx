'use client';

import { Card, CardContent, CardHeader } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import Image from 'next/image';
import { Button } from './ui/button';
import { Star } from 'lucide-react';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { Skeleton } from './ui/skeleton';

interface RecommendationsProps {
  recommendationsData: PersonalizedRecommendationsOutput | null;
}

export function Recommendations({ recommendationsData }: RecommendationsProps) {
  if (!recommendationsData || recommendationsData.recommendations.length === 0) {
    return null;
  }

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
                       <Button size="sm" variant="outline" className="text-primary border-primary">Ajouter</Button>
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
