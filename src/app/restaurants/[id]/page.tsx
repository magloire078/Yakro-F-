
'use client'

import * as React from 'react';
import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/data-context";
import { Clock, Star, Loader, Ear, Bike, Wand2, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default function RestaurantPage() {
    const params = useParams();
    const { getRestaurant, menuItems, isLoading } = useData();
    const restaurant = getRestaurant(params.id as string);

    const [userReviews, setUserReviews] = React.useState<Review[]>([]);
    const [aiReviews, setAiReviews] = React.useState<Review[]>([]);
    const [loadingAiReviews, setLoadingAiReviews] = React.useState(false);
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
    const { toast } = useToast();
    
    const allReviews = React.useMemo(() => [...userReviews, ...aiReviews], [userReviews, aiReviews]);

    const handleGenerateReviews = React.useCallback(async () => {
        if (!restaurant) return;
        setLoadingAiReviews(true);
        setAudioUrl(null);
        setAiReviews([]); // Clear existing AI reviews before generating new ones
        toast({
            title: 'Génération des avis IA en cours...',
            description: 'L\'IA imagine des expériences clients pour vous.'
        });
        try {
          const result = await generateReviews({
            restaurantName: restaurant.nom,
            cuisine: restaurant.cuisine,
            count: 3,
          });
          const newReviews = result.reviews.map((review, index) => ({
            ...review,
            id: `${restaurant.id}-aireview-${index}-${Date.now()}`,
            restaurantId: restaurant.id,
          }));
          setAiReviews(newReviews);
        } catch (error) {
          console.error('Failed to generate reviews:', error);
          toast({
            variant: 'destructive',
            title: 'Erreur de génération',
            description: "Impossible de générer les avis. Le quota de l'API est peut-être atteint.",
          });
        } finally {
          setLoadingAiReviews(false);
        }
    }, [restaurant, toast]);


     const handleGenerateAudio = React.useCallback(async () => {
        if (aiReviews.length === 0) return;
        setIsGeneratingAudio(true);
        toast({
            title: 'Génération Audio en cours...',
            description: 'L\'IA prépare la narration des avis.'
        });
        try {
            const audioInput = {
                reviews: aiReviews.map(r => ({ nomUtilisateur: r.nomUtilisateur, note: r.note, commentaire: r.commentaire }))
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
    }, [aiReviews, toast]);

    const handleAddReview = (newReview: Omit<Review, 'id' | 'restaurantId'>) => {
        if (!restaurant) return;
        const fullReview: Review = {
          ...newReview,
          id: `user-review-${Date.now()}`,
          restaurantId: restaurant.id,
        };
        setUserReviews(prev => [fullReview, ...prev]);
         toast({
          title: 'Avis ajouté !',
          description: 'Merci pour votre contribution.',
        });
    };

    const { averageRating, ratingsDistribution } = React.useMemo(() => {
        const reviewsToAnalyze = userReviews.length > 0 ? userReviews : allReviews;
        if (reviewsToAnalyze.length === 0) {
          return { 
            averageRating: '0.0', 
            ratingsDistribution: [
              { rating: 5, count: 0 }, { rating: 4, count: 0 }, { rating: 3, count: 0 }, { rating: 2, count: 0 }, { rating: 1, count: 0 },
            ] 
          };
        }
        const total = reviewsToAnalyze.reduce((acc, review) => acc + review.note, 0);
        const average = (total / reviewsToAnalyze.length).toFixed(1);
        const distribution = [5, 4, 3, 2, 1].map(star => ({
            rating: star,
            count: reviewsToAnalyze.filter(r => r.note === star).length
        }));
        return { averageRating: average, ratingsDistribution: distribution };
    }, [userReviews, allReviews]);


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
    const placeholder = getPlaceholderImage(restaurant.indiceImage);
    const imageSrc = (restaurant.image && !restaurant.image.includes('picsum.photos'))
        ? restaurant.image
        : placeholder.url;

    return (
        <div>
            {/* Header */}
            <div className="relative h-48 md:h-64 w-full -mx-4 md:-mx-8 -mt-4 md:-mt-8">
                <Image 
                    src={imageSrc}
                    alt={restaurant?.nom || 'Image du restaurant'}
                    fill
                    sizes="(max-width: 768px) 100vw, 100vw"
                    style={{objectFit: 'cover'}}
                    data-ai-hint={restaurant.indiceImage}
                    className="md:rounded-xl"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4 md:p-8 md:rounded-xl">
                    <div className="text-white">
                        <h1 className="text-2xl md:text-4xl font-display">{restaurant.nom}</h1>
                        <p className="text-md md:text-lg">{restaurant.cuisine}</p>
                    </div>
                </div>
            </div>

            <div className="py-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
                     <Badge variant="outline" className="flex items-center gap-1 text-base p-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{restaurant.note}</span>
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5" />
                        <span className="text-base">{restaurant.tempsDeLivraison} min</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Bike className="w-5 h-5" />
                        <span className="text-base">{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} FCFA` : 'Livraison gratuite'}</span>
                    </div>
                </div>

                {/* Menu Section */}
                <h2 className="text-2xl md:text-3xl font-display text-foreground mb-6">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
                    {restaurantMenu.length > 0 ? restaurantMenu.map(item => (
                        <MenuItemCard key={item.id} item={item} />
                    )) : (
                        <p className="text-muted-foreground md:col-span-2">Aucun plat disponible pour ce restaurant pour le moment.</p>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-2xl md:text-3xl font-display text-foreground">Avis</h2>
                        {allReviews.length > 0 && (
                            <div className="flex items-center gap-2 text-xl font-bold">
                                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                <span>{averageRating}</span>
                                <span className="text-sm text-muted-foreground font-normal">({userReviews.length > 0 ? userReviews.length : allReviews.length} avis)</span>
                            </div>
                        )}
                    </div>
                    
                    <Tabs defaultValue="clients">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="clients" className="text-xs sm:text-sm">
                                <Users className="mr-1 sm:mr-2 h-4 w-4"/>
                                <span className="hidden sm:inline">Avis des clients</span>
                                <span className="sm:hidden">Clients</span>
                            </TabsTrigger>
                            <TabsTrigger value="ia" className="text-xs sm:text-sm">
                                <Wand2 className="mr-1 sm:mr-2 h-4 w-4"/>
                                <span className="hidden sm:inline">Avis de l'IA</span>
                                <span className="sm:hidden">IA</span>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="clients" className="mt-4 space-y-6">
                            {userReviews.length > 0 ? userReviews.map(review => (
                                <ReviewCard key={review.id} review={review} />
                            )) : (
                                <p className="text-muted-foreground text-center pt-8">Aucun avis de client pour le moment. Soyez le premier !</p>
                            )}
                        </TabsContent>
                        <TabsContent value="ia" className="mt-4 space-y-6">
                             <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground flex-1">Générez des avis avec l'IA pour voir des exemples ou écoutez une narration audio.</p>
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                     <Button onClick={handleGenerateReviews} disabled={loadingAiReviews} variant="outline" className="w-full sm:w-auto">
                                        {loadingAiReviews ? <Loader className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                                        {loadingAiReviews ? 'Génération...' : 'Générer avis'}
                                    </Button>
                                    <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio || aiReviews.length === 0} variant="outline" className="w-full sm:w-auto">
                                        <Ear className="mr-2" />
                                        {isGeneratingAudio ? 'Création...' : 'Écouter'}
                                    </Button>
                                </div>
                            </div>
                             {audioUrl && (
                                <audio controls src={audioUrl} className="w-full">
                                    Votre navigateur ne supporte pas l'élément audio.
                                </audio>
                             )}
                            {loadingAiReviews && (
                                <div className="space-y-6">
                                    <Skeleton className="w-full h-32 rounded-lg" />
                                </div>
                            )}
                            {!loadingAiReviews && aiReviews.length > 0 && aiReviews.map(review => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                             {!loadingAiReviews && aiReviews.length === 0 && (
                                <p className="text-muted-foreground text-center pt-8">Générez des avis pour voir des exemples ici.</p>
                             )}
                        </TabsContent>
                    </Tabs>
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                     <div>
                        <h2 className="text-2xl font-display text-foreground mb-4">Laissez votre avis</h2>
                        <ReviewForm onSubmit={handleAddReview} />
                     </div>
                     {allReviews.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-display text-foreground mb-4">Répartition des notes</h2>
                          <RatingsChart data={ratingsDistribution} />
                        </div>
                     )}
                  </div>
                </div>
            </div>
        </div>
    )

}
