'use client'

import * as React from 'react';
import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/data-context";
import { Clock, Star, Loader, Ear, Bike, Wand2, Users, MapPin, ChevronLeft, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import { CldImage } from 'next-cloudinary';
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from '@/components/review-card';
import { ReviewForm } from '@/components/review-form';
import { RatingsChart } from '@/components/ratings-chart';
import type { Review } from '@/lib/types';
import { generateReviewsAction, generateAudioReviewAction } from '@/app/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function RestaurantPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const { getRestaurant, menuItems, isLoading } = useData();
    const restaurant = getRestaurant(id as string);

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
        setAiReviews([]);
        toast({
            title: 'Génération en cours...',
            description: 'L\'IA analyse les saveurs pour vous.'
        });
        try {
            const result = await generateReviewsAction({
                restaurantName: restaurant.nom,
                cuisine: restaurant.cuisine,
                count: 3,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            const newReviews = result.data.reviews.map((review, index) => ({
                ...review,
                id: `${restaurant.id}-aireview-${index}-${Date.now()}`,
                restaurantId: restaurant.id,
            }));
            setAiReviews(newReviews);
        } catch (error) {
            console.error('Failed to generate reviews:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Le chef IA est occupé. Réessayez bientôt !",
            });
        } finally {
            setLoadingAiReviews(false);
        }
    }, [restaurant, toast]);


    const handleGenerateAudio = React.useCallback(async () => {
        if (aiReviews.length === 0) return;
        setIsGeneratingAudio(true);
        try {
            const audioInput = {
                reviews: aiReviews.map(r => ({ nomUtilisateur: r.nomUtilisateur, note: r.note, commentaire: r.commentaire }))
            };
            const result = await generateAudioReviewAction(audioInput);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            setAudioUrl(result.data.audioDataUri);
        } catch (error) {
            console.error('Failed to generate audio review:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur Audio',
                description: "Impossible d'activer la narration."
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
            title: 'Merci !',
            description: 'Votre avis a été publié avec succès.',
        });
    };

    const { averageRating, ratingsDistribution } = React.useMemo(() => {
        const reviewsToAnalyze = userReviews.length > 0 ? userReviews : allReviews;
        if (reviewsToAnalyze.length === 0) {
            return {
                averageRating: restaurant?.note?.toString() || '0.0',
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
    }, [userReviews, allReviews, restaurant]);


    if (isLoading && !restaurant) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-[40vh] w-full rounded-[2.5rem]" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-64" />
                  <Skeleton className="h-6 w-96" />
                </div>
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-slate-100 rounded-full">
                    <ShoppingBag className="h-12 w-12 text-slate-300" />
                </div>
                <h2 className="text-2xl font-headline">Restaurant introuvable</h2>
                <Button onClick={() => router.push('/')} variant="outline" className="rounded-2xl">
                    Retour à l&apos;accueil
                </Button>
            </div>
        )
    }

    const restaurantMenu = menuItems.filter(item => item.restaurantId === id);
    const placeholder = getPlaceholderImage(restaurant.indiceImage);
    const imageSrc = (restaurant.image && !restaurant.image.includes('picsum.photos'))
        ? restaurant.image
        : placeholder.url;

    return (
        <div className="pb-24">
            {/* Cinematic Header */}
            <div className="relative h-[45vh] md:h-[55vh] w-full -mx-4 md:-mx-8 lg:-mx-12 -mt-4 md:-mt-8 mb-10 overflow-hidden shadow-2xl rounded-b-[3rem]">
                <motion.div 
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {imageSrc.includes('res.cloudinary.com') ? (
                        <CldImage
                            src={imageSrc}
                            alt={restaurant.nom}
                            fill
                            sizes="100vw"
                            crop="fill"
                            gravity="auto"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <Image
                            src={imageSrc}
                            alt={restaurant.nom}
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority
                        />
                    )}
                </motion.div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Back Button */}
                <Button 
                    variant="ghost" 
                    className="absolute top-8 left-8 z-30 glass text-white border-white/10 rounded-2xl h-12 w-12 p-0 active:scale-90 transition-transform"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-10 left-6 right-6 md:left-12 z-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <Badge className="glass-orange text-white font-black uppercase tracking-widest py-1.5 px-4 rounded-full border-none">
                            {restaurant.cuisine}
                        </Badge>
                        <div className="flex items-center gap-2 glass text-white py-1.5 px-4 rounded-full text-xs font-black border-white/10">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            {averageRating}
                        </div>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                        className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter"
                    >
                        {restaurant.nom}
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-5 text-white/90"
                    >
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="font-bold text-sm">{restaurant.tempsDeLivraison} MIN</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
                            <Bike className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-sm">{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} FCFA` : 'OFFERTE'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold uppercase">Yakro</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <Tabs defaultValue="menu" className="w-full">
                    <div className="flex items-center justify-between mb-10 border-b border-slate-200 dark:border-slate-800 pb-0 overflow-x-auto scrollbar-hide">
                        <TabsList className="bg-transparent h-auto p-0 gap-8 flex-nowrap">
                            <TabsTrigger 
                                value="menu" 
                                className="bg-transparent data-[state=active]:bg-transparent border-b-[3px] border-transparent data-[state=active]:border-orange-500 rounded-none px-0 py-4 text-sm font-black uppercase tracking-widest transition-all data-[state=active]:text-orange-500"
                            >
                                <ShoppingBag className="mr-2 h-4 w-4" /> Menu
                            </TabsTrigger>
                            <TabsTrigger 
                                value="reviews" 
                                className="bg-transparent data-[state=active]:bg-transparent border-b-[3px] border-transparent data-[state=active]:border-orange-500 rounded-none px-0 py-4 text-sm font-black uppercase tracking-widest transition-all data-[state=active]:text-orange-500"
                            >
                                <Users className="mr-2 h-4 w-4" /> Avis
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                            Expérience Elite
                        </div>
                    </div>

                    <TabsContent value="menu" className="mt-0 outline-none">
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-8 w-1 bg-orange-500 rounded-full" />
                                <h2 className="text-2xl font-headline">Nos Incontournables</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {restaurantMenu.length > 0 ? restaurantMenu.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <MenuItemCard item={item} />
                                    </motion.div>
                                )) : (
                                    <div className="md:col-span-3 py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-slate-400">Le menu arrive bientôt. Restez connectés !</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-12">
                                {/* AI Experience Generator */}
                                <section className="relative overflow-hidden p-8 glass-dark rounded-[2.5rem] text-white border-white/5">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px]" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                        <div className="flex-1 space-y-5 text-center md:text-left">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-orange rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                                <Sparkles className="h-3 w-3" /> Yakro Intelligence
                                            </div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter">Pas encore d&apos;idée ?</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm opacity-80">
                                                Laissez notre IA transcender votre choix. Simulez l&apos;ambiance et écoutez le récit sensoriel des saveurs.
                                            </p>
                                            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                                                <Button 
                                                    onClick={handleGenerateReviews} 
                                                    disabled={loadingAiReviews}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
                                                >
                                                    {loadingAiReviews ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                                    Simuler l&apos;ambiance
                                                </Button>
                                                <Button 
                                                    onClick={handleGenerateAudio} 
                                                    disabled={isGeneratingAudio || aiReviews.length === 0}
                                                    variant="ghost"
                                                    className="glass text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs border-white/10 hover:bg-white/10"
                                                >
                                                    {isGeneratingAudio ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Ear className="mr-2 h-4 w-4" />}
                                                    Narrateur Audio
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="w-40 h-40 shrink-0 flex items-center justify-center glass rounded-full border-white/10 shadow-2xl animate-float">
                                            <Wand2 className={cn("w-14 h-14 text-orange-500", loadingAiReviews && "animate-pulse")} />
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {audioUrl && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-8 pt-8 border-t border-white/10"
                                            >
                                                <audio controls src={audioUrl} className="w-full brightness-0 invert opacity-60">
                                                    Votre navigateur ne supporte pas l&apos;élément audio.
                                                </audio>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Review Feed */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-headline">Expériences Partagées</h2>
                                        <Badge variant="secondary" className="rounded-full px-3">{allReviews.length} avis</Badge>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {userReviews.length > 0 ? userReviews.map((review, idx) => (
                                            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                                                <ReviewCard review={review} />
                                            </motion.div>
                                        )) : aiReviews.length > 0 ? aiReviews.map((review, idx) => (
                                            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                                                <ReviewCard review={review} />
                                            </motion.div>
                                        )) : (
                                            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem]">
                                                <p className="text-slate-400">Aucun avis pour le moment. Partagez votre expérience !</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-1 space-y-12">
                                <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-xl font-headline mb-6">Évaluez votre plat</h3>
                                    <ReviewForm onSubmit={handleAddReview} />
                                </div>
                                
                                {allReviews.length > 0 && (
                                    <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                                        <h3 className="text-xl font-headline mb-2">Analyse des Notes</h3>
                                        <p className="text-xs text-slate-400 mb-6 italic">Visualisation en temps réel des avis clients.</p>
                                        <RatingsChart data={ratingsDistribution} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function RestaurantPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-[80vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader className="h-12 w-12 animate-spin text-orange-500" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Chargement des saveurs...</p>
                </div>
            </div>
        }>
            <RestaurantPageContent />
        </React.Suspense>
    );
}
