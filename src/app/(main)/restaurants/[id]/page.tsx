

'use client'

import * as React from 'react';
import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/data-context";
import { Clock, Star, Loader, Ear } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from '@/components/review-card';
import { ReviewForm } from '@/components/review-form';
import { RatingsChart } from '@/components/ratings-chart';
import type { Review } from '@/lib/types';
import { generateReviews } from '@/ai/flows/generate-reviews-flow';
import { generateAudioReview } from '@/ai/flows/generate-audio-review-flow';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function RestaurantPage() {
    const params = useParams();
    const { getRestaurant, menuItems, isLoading } = useData();
    const restaurant = getRestaurant(params.id as string);

    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = React.useState(false);
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
    const { toast } = useToast();

    const handleGenerateReviews = React.useCallback(async () => {
        if (!restaurant) return;
        setLoadingReviews(true);
        setAudioUrl(null);
        setReviews([]); // Clear existing reviews before generating new ones
        toast({
            title: 'Génération des avis en cours...',
            description: 'L\'IA imagine des expériences clients pour vous.'
        });
        try {
          const result = await generateReviews({
            restaurantName: restaurant.name,
            cuisine: restaurant.cuisine,
            count: 5,
          });
          const newReviews = result.reviews.map((review, index) => ({
            ...review,
            id: `${restaurant.id}-review-${index}-${Date.now()}`,
            restaurantId: restaurant.id,
          }));
          setReviews(newReviews);
        } catch (error) {
          console.error('Failed to generate reviews:', error);
          toast({
            variant: 'destructive',
            title: 'Erreur de génération',
            description: "Impossible de générer les avis. Le quota de l'API est peut-être atteint.",
          });
        } finally {
          setLoadingReviews(false);
        }
    }, [restaurant, toast]);


     const handleGenerateAudio = React.useCallback(async () => {
        if (reviews.length === 0) return;
        setIsGeneratingAudio(true);
        toast({
            title: 'Génération Audio en cours...',
            description: 'L\'IA prépare la narration des avis.'
        });
        try {
            const audioInput = {
                reviews: reviews.map(r => ({ userName: r.userName, rating: r.rating, comment: r.comment }))
            };
            const result = await generateAudioReview(audioInput);
            setAudioUrl(result.audioDataUri);
        } catch(error) {
            console.error('Failed to generate audio review:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur Audio',
                description: "Impossible de générer la narration audio."
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    }, [reviews, toast]);

    const handleAddReview = (newReview: Omit<Review, 'id' | 'restaurantId'>) => {
        if (!restaurant) return;
        const fullReview: Review = {
          ...newReview,
          id: `user-review-${Date.now()}`,
          restaurantId: restaurant.id,
        };
        setReviews(prev => [fullReview, ...prev]);
         toast({
          title: 'Avis ajouté !',
          description: 'Merci pour votre contribution.',
        });
    };

    const { averageRating, ratingsDistribution } = React.useMemo(() => {
        if (reviews.length === 0) {
          return { 
            averageRating: '0.0', 
            ratingsDistribution: [
              { rating: 5, count: 0 }, { rating: 4, count: 0 }, { rating: 3, count: 0 }, { rating: 2, count: 0 }, { rating: 1, count: 0 },
            ] 
          };
        }
        const total = reviews.reduce((acc, review) => acc + review.rating, 0);
        const average = (total / reviews.length).toFixed(1);
        const distribution = [5, 4, 3, 2, 1].map(star => ({
            rating: star,
            count: reviews.filter(r => r.rating === star).length
        }));
        return { averageRating: average, ratingsDistribution: distribution };
    }, [reviews]);


    if (isLoading && !restaurant) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-48 md:h-64 w-full -mx-4 md:-mx-8 -mt-4 md:-mt-8 md:rounded-xl" />
                <div className="py-8">
                     <Skeleton className="h-10 w-48 mb-8" />
                     <Skeleton className="h-8 w-32 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    if (!restaurant) {
        return <div className="text-center py-10">Restaurant non trouvé</div>
    }

    const restaurantMenu = menuItems.filter(item => item.restaurantId === params.id);

    return (
        <div>
            {/* Header */}
            <div className="relative h-48 md:h-64 w-full -mx-4 md:-mx-8 -mt-4 md:-mt-8">
                <Image 
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{objectFit: 'cover'}}
                    data-ai-hint={restaurant.imageHint}
                    className="md:rounded-xl"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4 md:p-8 md:rounded-xl">
                    <div className="text-white">
                        <h1 className="text-3xl md:text-5xl font-headline">{restaurant.name}</h1>
                        <p className="text-md md:text-lg">{restaurant.cuisine}</p>
                    </div>
                </div>
            </div>

            <div className="py-8">
                <div className="flex items-center gap-6 mb-8">
                     <Badge variant="outline" className="flex items-center gap-1 text-base p-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{restaurant.rating}</span>
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5" />
                        <span className="text-base">{restaurant.deliveryTime} min</span>
                    </div>
                </div>

                {/* Menu Section */}
                <h2 className="text-2xl md:text-3xl font-headline text-foreground mb-6">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
                    {restaurantMenu.length > 0 ? restaurantMenu.map(item => (
                        <MenuItemCard key={item.id} item={item} />
                    )) : (
                        <p className="text-muted-foreground md:col-span-2">Aucun plat disponible pour ce restaurant pour le moment.</p>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl md:text-3xl font-headline text-foreground">Avis des clients</h2>
                            {reviews.length > 0 && (
                                <div className="flex items-center gap-2 text-xl font-bold">
                                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                    <span>{averageRating}</span>
                                    <span className="text-sm text-muted-foreground font-normal">({reviews.length} avis)</span>
                                </div>
                            )}
                        </div>
                        <Button onClick={handleGenerateReviews} disabled={loadingReviews}>
                            {loadingReviews ? <Loader className="animate-spin mr-2" /> : null}
                            {loadingReviews ? 'Génération...' : 'Régénérer les avis'}
                        </Button>
                    </div>
                    
                    {reviews.length > 0 && (
                      <>
                      {audioUrl ? (
                          <audio controls src={audioUrl} className="w-full">
                              Votre navigateur ne supporte pas l'élément audio.
                          </audio>
                      ) : (
                          <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio || reviews.length === 0} variant="outline">
                              <Ear className="mr-2" />
                              {isGeneratingAudio ? 'Création Audio...' : 'Écouter les avis'}
                          </Button>
                      )}
                      </>
                    )}


                    {loadingReviews && (
                        <div className="space-y-6">
                            <Skeleton className="w-full h-32 rounded-lg" />
                            <Skeleton className="w-full h-32 rounded-lg" />
                        </div>
                    )}
                    {!loadingReviews && reviews.length > 0 && reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                    {!loadingReviews && reviews.length === 0 && <p className="text-muted-foreground">Aucun avis pour ce restaurant. Soyez le premier à en laisser un, ou générez-en avec l'IA.</p>}
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                     <div>
                        <h2 className="text-2xl font-headline text-foreground mb-4">Laissez votre avis</h2>
                        <ReviewForm onSubmit={handleAddReview} />
                     </div>
                     {reviews.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-headline text-foreground mb-4">Répartition des notes</h2>
                          <RatingsChart data={ratingsDistribution} />
                        </div>
                     )}
                  </div>
                </div>
            </div>
        </div>
    )
}
