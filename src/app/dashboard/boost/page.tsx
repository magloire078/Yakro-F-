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
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

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
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <Rocket className="h-4 w-4" />,
                badgeText: "Algorithme Elite",
                title: <>Propulser <span className="text-orange-500 italic">le Restaurant</span></>,
                subtitle: "Dominez le classement et maximisez votre visibilité",
                children: (
                    <DashboardStats 
                        items={[
                            { label: "Portée", value: "+40%", color: "orange" },
                            { label: "Vitesse", value: "MAX", color: "emerald" }
                        ]}
                    />
                )
            }}
        >

                {myRestaurants.length > 0 ? (
                    <div className="grid gap-6">
                        {myRestaurants.map((restaurant, idx) => (
                            <motion.div
                                key={restaurant.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className="bg-card/40 backdrop-blur-xl border border-border relative group overflow-hidden shadow-2xl rounded-[2.5rem] transition-all duration-500 hover:border-orange-500/30"
                            >
                                <div className={`absolute top-0 left-0 w-[2px] h-full transition-all duration-1000 ${restaurant.enVedette ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]' : 'bg-muted'}`} />
                                
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-16 w-16 flex items-center justify-center border transition-all duration-700 rounded-2xl ${restaurant.enVedette ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_10px_20px_rgba(249,115,22,0.1)]' : 'bg-muted border-border'}`}>
                                            <Rocket className={`h-8 w-8 transition-all duration-700 ${restaurant.enVedette ? 'text-orange-500 scale-110' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-foreground group-hover:text-orange-500 transition-colors duration-300">{restaurant.nom}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Zap className={`h-3 w-3 ${restaurant.enVedette ? 'text-orange-500' : 'text-muted'}`} />
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{restaurant.cuisine}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-10 bg-muted/30 md:bg-transparent p-6 md:p-0 border border-border md:border-none relative overflow-hidden rounded-2xl">
                                        {restaurant.enVedette && (
                                            <div className="absolute inset-0 bg-orange-500/5 md:hidden animate-pulse" />
                                        )}
                                        <div className="flex flex-col gap-1 relative z-10">
                                            <Label htmlFor={`boost-${restaurant.id}`} className="text-[11px] font-black uppercase tracking-[0.2em] italic text-foreground cursor-pointer group-hover:text-orange-500 transition-colors">
                                                Propulsion Vedette
                                            </Label>
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">Impact Algorithmique Max</span>
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
                                                className="data-[state=checked]:bg-orange-500 scale-125 border-border"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute bottom-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Rocket className="h-24 w-24 -rotate-12 translate-x-8 translate-y-8 text-foreground" />
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
                    <div className="max-w-2xl mx-auto bg-card/40 backdrop-blur-xl border border-border p-16 text-center shadow-2xl relative overflow-hidden rounded-[3rem]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <Rocket className="h-20 w-20 text-orange-500/20 mx-auto mb-8" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground mb-4">Escouade Vide</h2>
                        <p className="text-muted-foreground font-medium mb-10 text-lg italic uppercase tracking-wider">
                            Enrôlez un établissement pour activer la propulsion.
                        </p>
                        <Button asChild className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic uppercase tracking-tighter text-lg shadow-[0_20px_40px_rgba(249,115,22,0.2)] transition-all hover:scale-105">
                            <Link href="/dashboard/new-restaurant">Créer mon premier Restaurant</Link>
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-card/40 backdrop-blur-xl border border-border p-8 flex items-start gap-6 group hover:border-orange-500/30 transition-all duration-500 rounded-[2rem] shadow-2xl"
                    >
                        <div className="h-12 w-12 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform rounded-2xl">
                            <PartyPopper className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-3">Impact Algorithmique</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic uppercase tracking-tight">
                                Les restaurants Vedettes bénéficient d&apos;un placement préférentiel, augmentant la conversion de 40% en moyenne grâce à une exposition ciblée.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-card/40 backdrop-blur-xl border border-border p-8 flex items-start gap-6 group hover:border-white/20 transition-all duration-500 rounded-[2rem] shadow-2xl"
                    >
                        <div className="h-12 w-12 bg-muted border border-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform rounded-2xl">
                            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-3">Gestion Stratégique</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic uppercase tracking-tight">
                                Activez ou désactivez la propulsion à tout moment. Vous gardez un contrôle total sur votre stratégie de visibilité et de croissance.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Branding Footer removed - now integrated in DashboardPage */}
        </DashboardPage>
    );
}
