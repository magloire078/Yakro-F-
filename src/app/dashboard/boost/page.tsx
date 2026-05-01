'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData, updateRestaurant } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader, Rocket, PartyPopper, Zap, Star, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBackButton } from '@/components/mobile-back-button';

export default function BoostPage() {
    const { user, activeRole } = useAuth();
    const { restaurants } = useData();
    const { db } = useFirebase();
    const { toast } = useToast();
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);
    const router = useRouter();

    const myRestaurants = React.useMemo(() => {
        if (!user || activeRole !== 'restaurateur') return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user, activeRole]);

    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Veuillez sélectionner le profil "Restaurateur" pour accéder à cette page.',
            });
            router.push('/');
        }
    }, [user, activeRole, router, toast]);
    
    const handleBoostToggle = async (restaurant: Restaurant) => {
        setUpdatingId(restaurant.id);
        const newStatus = !restaurant.enVedette;
        try {
            await updateRestaurant(db, restaurant.id, { enVedette: newStatus }, null);

            toast({
                title: 'Propulsion Activée',
                description: `${restaurant.nom} est désormais en tête de liste.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Erreur Critique',
                description: 'Impossible d\'activer la propulsion.',
            });
        } finally {
            setUpdatingId(null);
        }
    };
    
    if (!user || activeRole !== 'restaurateur') return null;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-32 overflow-x-hidden">
            {/* Cinematic Hero Section */}
            <div className="relative h-[35vh] md:h-[55vh] w-full overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
                    alt="Boost Background"
                    fill
                    className="object-cover opacity-40 scale-105 animate-slow-zoom"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-black/60" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-10">
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Dashboard" href="/dashboard" />
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-4"
                    >
                        <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Accélérateur Elite</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none"
                    >
                        Boost <span className="text-orange-500">Vedette</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 font-medium text-[10px] md:text-xs uppercase tracking-[0.3em]"
                    >
                        Propulsion algorithmique et visibilité maximale
                    </motion.p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
                {myRestaurants.length > 0 ? (
                    <div className="grid gap-6">
                        {myRestaurants.map((restaurant, idx) => (
                            <motion.div
                                key={restaurant.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 relative group overflow-hidden shadow-2xl"
                            >
                                <div className={`absolute top-0 left-0 w-[2px] h-full transition-all duration-1000 ${restaurant.enVedette ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]' : 'bg-gray-800'}`} />
                                
                                <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className={`h-20 w-20 flex items-center justify-center border border-white/5 transition-all duration-700 ${restaurant.enVedette ? 'bg-orange-500/20 border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'bg-white/5'}`}>
                                            <Rocket className={`h-10 w-10 transition-all duration-700 ${restaurant.enVedette ? 'text-orange-500 scale-110' : 'text-gray-700'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white group-hover:text-orange-500 transition-colors duration-300">{restaurant.nom}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Zap className={`h-3 w-3 ${restaurant.enVedette ? 'text-orange-500' : 'text-gray-600'}`} />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{restaurant.cuisine}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-10 bg-white/5 md:bg-transparent p-6 md:p-0 border border-white/5 md:border-none relative overflow-hidden">
                                        {restaurant.enVedette && (
                                            <div className="absolute inset-0 bg-orange-500/5 md:hidden animate-pulse" />
                                        )}
                                        <div className="flex flex-col gap-1 relative z-10">
                                            <Label htmlFor={`boost-${restaurant.id}`} className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white cursor-pointer group-hover:text-orange-500 transition-colors">
                                                Propulsion Vedette
                                            </Label>
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Impact Algorithmique Max</span>
                                        </div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <AnimatePresence mode="wait">
                                                {updatingId === restaurant.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                    >
                                                        <Loader className="h-5 w-5 animate-spin text-orange-500" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <Switch
                                                id={`boost-${restaurant.id}`}
                                                checked={restaurant.enVedette || false}
                                                onCheckedChange={() => handleBoostToggle(restaurant)}
                                                disabled={updatingId === restaurant.id}
                                                className="data-[state=checked]:bg-orange-500 scale-125"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute bottom-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                                    <Rocket className="h-24 w-24 -rotate-12 translate-x-8 translate-y-8" />
                                </div>

                                {restaurant.enVedette && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute top-0 right-0 p-6"
                                    >
                                        <Star className="h-6 w-6 text-orange-500 fill-orange-500 animate-float" />
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}

                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-16 text-center shadow-2xl relative overflow-hidden rounded-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <Rocket className="h-20 w-20 text-orange-500/20 mx-auto mb-8" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Escouade Vide</h2>
                        <p className="text-gray-400 font-medium mb-10 text-lg">
                            Enrôlez un établissement pour activer la propulsion.
                        </p>
                        <Button asChild className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                            <Link href="/dashboard/new-restaurant">Créer mon premier Restaurant</Link>
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-orange-500/5 border border-orange-500/10 p-8 flex items-start gap-6 group hover:bg-orange-500/10 transition-all duration-500"
                    >
                        <div className="h-12 w-12 bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <PartyPopper className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-3">Impact Algorithmique</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                Les restaurants Vedettes bénéficient d&apos;un placement préférentiel, augmentant la conversion de 40% en moyenne grâce à une exposition ciblée.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white/5 border border-white/10 p-8 flex items-start gap-6 group hover:bg-white/10 transition-all duration-500"
                    >
                        <div className="h-12 w-12 bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300 mb-3">Gestion Stratégique</h4>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                Activez ou désactivez la propulsion à tout moment. Vous gardez un contrôle total sur votre stratégie de visibilité et de croissance.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
