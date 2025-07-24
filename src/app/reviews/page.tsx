
'use client';

import * as React from 'react';
import { useImages } from '@/contexts/image-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { generateReviews } from '@/ai/flows/generate-reviews-flow';
import { generateAudioReview } from '@/ai/flows/generate-audio-review-flow';
import { ReviewCard } from '@/components/review-card';
import { ReviewForm } from '@/components/review-form';
import type { Review, Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Ear, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReviewsPage() {
  const { restaurants } = useImages();
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(restaurants[0] || null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);

  const { toast } = useToast();

  const handleGenerateReviews = React.useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    setAudioUrl(null);
    setReviews([]);
    try {
      const result = await generateReviews({
        restaurantName: selectedRestaurant.name,
        cuisine: selectedRestaurant.cuisine,
        count: 5,
      });
      const newReviews = result.reviews.map((review, index) => ({
        ...review,
        id: `${selectedRestaurant.id}-review-${index}-${Date.now()}`,
        restaurantId: selectedRestaurant.id,
      }));
      setReviews(newReviews);
    } catch (error) {
      console.error('Failed to generate reviews:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de générer les avis pour le moment.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant, toast]);
  
  const handleGenerateAudio = React.useCallback(async () => {
    if (reviews.length === 0) return;
    setIsGeneratingAudio(true);
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


  React.useEffect(() => {
    if (selectedRestaurant) {
      handleGenerateReviews();
    }
  }, [selectedRestaurant, handleGenerateReviews]);

  const handleAddReview = (newReview: Omit<Review, 'id' | 'restaurantId'>) => {
    if (!selectedRestaurant) return;
    const fullReview: Review = {
      ...newReview,
      id: `user-review-${Date.now()}`,
      restaurantId: selectedRestaurant.id,
    };
    setReviews(prev => [fullReview, ...prev]);
     toast({
      title: 'Avis ajouté !',
      description: 'Merci pour votre contribution.',
    });
  };
  
  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-headline text-primary">Avis des clients</h1>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={value => setSelectedRestaurant(restaurants.find(r => r.id === value) || null)}
            defaultValue={selectedRestaurant?.id}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Sélectionnez un restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedRestaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-headline text-foreground">{selectedRestaurant.name}</h2>
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            <span>{averageRating}</span>
                            <span className="text-sm text-muted-foreground font-normal">({reviews.length} avis)</span>
                        </div>
                    )}
                </div>
                 <Button onClick={handleGenerateReviews} disabled={loading || !selectedRestaurant}>
                    {loading ? 'Génération...' : 'Régénérer les avis'}
                </Button>
            </div>
            
            {audioUrl ? (
                <audio controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            ) : (
                <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio || reviews.length === 0}>
                    <Ear className="mr-2" />
                    {isGeneratingAudio ? 'Création Audio...' : 'Écouter les avis'}
                </Button>
            )}


            {loading && (
                <div className="space-y-6">
                    <Skeleton className="w-full h-32 rounded-lg" />
                    <Skeleton className="w-full h-32 rounded-lg" />
                    <Skeleton className="w-full h-32 rounded-lg" />
                </div>
            )}
            {!loading && reviews.length > 0 && reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {!loading && reviews.length === 0 && <p>Aucun avis pour ce restaurant. Soyez le premier !</p>}
          </div>

          <div className="lg:col-span-1">
             <h2 className="text-2xl font-headline text-foreground mb-4">Laissez votre avis</h2>
             <ReviewForm onSubmit={handleAddReview} />
          </div>
        </div>
      )}
    </div>
  );
}
