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
import { RatingsChart } from '@/components/ratings-chart';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Review } from '@/lib/types';
import { generateReviewsAction, generateAudioReviewAction } from '@/app/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/contexts/firebase-provider';
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
    const { db } = useFirebase();

    const [userReviews, setUserReviews] = React.useState<Review[]>([]);
    const [aiReviews, setAiReviews] = React.useState<Review[]>([]);
    const [loadingAiReviews, setLoadingAiReviews] = React.useState(false);
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
    const { toast } = useToast();

    // Avis vérifiés : chargés depuis Firestore (un avis ne peut exister que
    // pour une commande livrée de ce restaurant — voir firestore.rules).
    React.useEffect(() => {
        if (!id) return;
        getDocs(query(collection(db, 'avis'), where('restaurantId', '==', id)))
            .then((snap) => {
                const reviews = snap.docs.map((d) => d.data() as Review)
                    .sort((a, b) => (a.date < b.date ? 1 : -1));
                setUserReviews(reviews);
            })
            .catch((error) => console.error('Échec du chargement des avis:', error));
    }, [db, id]);

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

            const newReviews: Review[] = result.data.reviews.map((review, index) => ({
                ...review,
                id: `${restaurant.id}-aireview-${index}-${Date.now()}`,
                restaurantId: restaurant.id,
                // Avis simulés par l'IA à titre de démonstration — jamais
                // persistés, donc pas de vraie commande/utilisateur associé.
                userId: 'ai-demo',
                orderId: `ai-demo-${index}-${Date.now()}`,
                date: new Date().toISOString(),
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
        <div className="pb-16 sm:pb-24">
            {/* Cinematic Header */}
            <div className="relative h-[32vh] sm:h-[42vh] md:h-[50vh] w-full -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 -mt-3 sm:-mt-4 md:-mt-8 mb-4 sm:mb-8 overflow-hidden shadow-xl rounded-b-3xl sm:rounded-b-[3rem]">
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
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 bg-black/30 hover:bg-black/50 hover:text-white backdrop-blur-md border border-white/15 text-white rounded-xl sm:rounded-2xl h-9 w-9 sm:h-11 sm:w-11 p-0 active:scale-90 transition-transform"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 md:left-12 z-20 space-y-1.5 sm:space-y-3">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center gap-1.5 sm:gap-2.5"
                    >
                        <Badge className="glass-orange text-white font-black uppercase tracking-wider py-0.5 sm:py-1 px-2.5 sm:px-3.5 text-[10px] sm:text-xs rounded-full border-none">
                            {restaurant.cuisine}
                        </Badge>
                        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md border border-white/15 text-white py-0.5 sm:py-1 px-2.5 sm:px-3.5 rounded-full text-[10px] sm:text-xs font-bold">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {averageRating}
                        </div>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                        className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter"
                    >
                        {restaurant.nom}
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm"
                    >
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold">{restaurant.tempsDeLivraison} MIN</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/5">
                            <Bike className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-bold">{restaurant.fraisDeLivraison > 0 ? `${restaurant.fraisDeLivraison.toLocaleString('fr-FR')} F` : 'OFFERTE'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/5">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-bold uppercase text-[10px] sm:text-xs">Yakro</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-1 sm:px-0">
                <Tabs defaultValue="menu" className="w-full">
                    <div className="flex items-center justify-between mb-4 sm:mb-8 border-b border-slate-200 dark:border-slate-800 pb-0 overflow-x-auto scrollbar-hide">
                        <TabsList className="bg-transparent h-auto p-0 gap-6 sm:gap-8 flex-nowrap">
                            <TabsTrigger 
                                value="menu" 
                                className="bg-transparent data-[state=active]:bg-transparent border-b-[2.5px] border-transparent data-[state=active]:border-primary rounded-none px-0 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all data-[state=active]:text-primary"
                            >
                                <ShoppingBag className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Menu
                            </TabsTrigger>
                            <TabsTrigger 
                                value="reviews" 
                                className="bg-transparent data-[state=active]:bg-transparent border-b-[2.5px] border-transparent data-[state=active]:border-primary rounded-none px-0 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all data-[state=active]:text-primary"
                            >
                                <Users className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Avis
                            </TabsTrigger>
                        </TabsList>
                        
                        <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            Expérience Elite
                        </div>
                    </div>

                    <TabsContent value="menu" className="mt-0 outline-none">
                        <section>
                            <div className="flex items-center gap-2.5 mb-3 sm:mb-6">
                                <div className="h-5 sm:h-6 w-1 bg-primary rounded-full" />
                                <h2 className="text-lg sm:text-2xl font-headline">Nos Incontournables</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                {restaurantMenu.length > 0 ? restaurantMenu.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.04 }}
                                    >
                                        <MenuItemCard item={item} />
                                    </motion.div>
                                )) : (
                                    <div className="md:col-span-3 py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-slate-400 text-sm">Le menu arrive bientôt. Restez connectés !</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                            <div className="lg:col-span-2 space-y-6 sm:space-y-10">
                                {/* AI Experience Generator */}
                                <section className="relative overflow-hidden p-4 sm:p-8 glass-dark rounded-2xl sm:rounded-3xl text-foreground">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 sm:gap-8">
                                        <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 glass-orange rounded-full text-primary text-[10px] sm:text-[10px] font-black uppercase tracking-wider">
                                                <Sparkles className="h-3 w-3" /> Yakro Intelligence
                                            </div>
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">Pas encore d&apos;idée ?</h3>
                                            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-sm">
                                                Laissez notre IA transcender votre choix. Simulez l&apos;ambiance et écoutez le récit sensoriel des saveurs.
                                            </p>
                                            <div className="flex flex-wrap gap-2.5 sm:gap-4 justify-center md:justify-start pt-2">
                                                <Button 
                                                    onClick={handleGenerateReviews} 
                                                    disabled={loadingAiReviews}
                                                    className="bg-primary hover:bg-primary/90 text-white rounded-xl sm:rounded-2xl h-10 sm:h-12 px-5 sm:px-6 font-bold uppercase tracking-wider text-xs shadow-md"
                                                >
                                                    {loadingAiReviews ? <Loader className="animate-spin mr-1.5 h-3.5 w-3.5" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                                                    Simuler l&apos;ambiance
                                                </Button>
                                                <Button 
                                                    onClick={handleGenerateAudio} 
                                                    disabled={isGeneratingAudio || aiReviews.length === 0}
                                                    variant="ghost"
                                                    className="glass text-foreground rounded-xl sm:rounded-2xl h-10 sm:h-12 px-5 sm:px-6 font-bold uppercase tracking-wider text-xs border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10"
                                                >
                                                    {isGeneratingAudio ? <Loader className="animate-spin mr-1.5 h-3.5 w-3.5" /> : <Ear className="mr-1.5 h-3.5 w-3.5" />}
                                                    Narrateur Audio
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center glass rounded-full border-border dark:border-white/10 shadow-lg animate-float">
                                            <Wand2 className={cn("w-8 h-8 sm:w-10 sm:h-10 text-primary", loadingAiReviews && "animate-pulse")} />
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {audioUrl && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border dark:border-white/10"
                                            >
                                                <audio controls src={audioUrl} className="w-full opacity-80 dark:brightness-0 dark:invert dark:opacity-60">
                                                    Votre navigateur ne supporte pas l&apos;élément audio.
                                                </audio>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Review Feed */}
                                <section className="space-y-4 sm:space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg sm:text-2xl font-headline">Expériences Partagées</h2>
                                        <Badge variant="secondary" className="rounded-full px-2.5 text-xs">{allReviews.length} avis</Badge>
                                    </div>
                                    
                                    <div className="space-y-3 sm:space-y-4">
                                        {userReviews.length > 0 ? userReviews.map((review, idx) => (
                                            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.08 }}>
                                                <ReviewCard review={review} />
                                            </motion.div>
                                        )) : aiReviews.length > 0 ? aiReviews.map((review, idx) => (
                                            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.08 }}>
                                                <ReviewCard review={review} />
                                            </motion.div>
                                        )) : (
                                            <div className="text-center py-8 sm:py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                                <p className="text-slate-400 text-sm">Aucun avis pour le moment. Partagez votre expérience !</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-headline mb-1">Avis vérifiés</h3>
                                    <p className="text-xs sm:text-sm text-slate-400">
                                        Seuls les clients livrés peuvent laisser un avis, depuis leur{' '}
                                        <a href="/orders" className="text-primary font-bold hover:underline">historique de commandes</a>.
                                    </p>
                                </div>

                                {allReviews.length > 0 && (
                                    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                                        <h3 className="text-base sm:text-lg font-headline mb-1">Analyse des Notes</h3>
                                        <p className="text-[11px] sm:text-xs text-slate-400 mb-4 italic">Visualisation en temps réel des avis clients.</p>
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
                  <Loader className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Chargement des saveurs...</p>
                </div>
            </div>
        }>
            <RestaurantPageContent />
        </React.Suspense>
    );
}
