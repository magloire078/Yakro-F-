'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader, QrCode, UtensilsCrossed, Clock, Receipt, ChefHat, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QrCodeDialog } from '@/components/qr-code-dialog';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { canTransitionOrder } from '@/lib/order-transitions';
import { motion, AnimatePresence } from 'framer-motion';

import Image from 'next/image';
import { MobileBackButton } from '@/components/mobile-back-button';

export default function DashboardOrdersPage() {
    const { user, activeRole } = useAuth();
    const { orders, restaurants } = useData();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
    // Sur un réseau mobile faible, l'image de fond hotlinkée (Unsplash) peut
    // échouer à charger et son texte alternatif s'affiche alors comme du
    // texte visible qui déborde du conteneur, faisant paraître toute la
    // page "trop large" — on arrête de la rendre en cas d'échec.
    const [bgImageFailed, setBgImageFailed] = React.useState(false);

    const myRestaurantIds = React.useMemo(() => {
        if (activeRole !== 'restaurateur' || !user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid).map(r => r.id);
    }, [restaurants, activeRole, user]);

    const myOrders = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return orders.filter(o => myRestaurantIds.includes(o.restaurantId));
    }, [orders, myRestaurantIds]);

    const newOrders = React.useMemo(() => {
        return myOrders
            .filter(o => o.statut === 'Placée')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [myOrders]);
    
    const preparingOrders = React.useMemo(() => {
        return myOrders
            .filter(o => o.statut === 'En Préparation')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [myOrders]);

    const handleAcceptOrder = async (order: Order) => {
        setIsUpdating(order.id);
        
        try {
            await updateOrderStatusAction({
                orderId: order.id,
                status: 'En Préparation',
                orderData: order
            });
            toast({
                title: "Excellence Confirmée",
                description: "La préparation de la commande a débuté.",
            });
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour le statut de la commande.",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const OrderCard = ({ order }: { order: Order }) => (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative glass-dark overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-2xl rounded-2xl sm:rounded-3xl shadow-lg"
        >
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${
                order.statut === 'Placée' ? 'bg-primary' : 'bg-emerald-500'
            }`} />
            
            <div className="p-4 sm:p-5 md:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Elite Order</span>
                            </div>
                            {order.prioritaire && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                    <Crown className="h-2.5 w-2.5 text-amber-500" />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Prioritaire</span>
                                </div>
                            )}
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-base sm:text-xl md:text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase leading-tight">
                            {order.nomRestaurant}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={`rounded-full px-2.5 sm:px-3 py-0.5 font-black uppercase text-[9px] sm:text-[10px] tracking-wider border ${
                            order.statut === 'Placée' 
                                ? 'border-primary/30 text-primary bg-primary/10' 
                                : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                        }`}>
                            {order.statut === 'Placée' ? 'Nouveau' : 'En Cuisine'}
                        </Badge>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 dark:bg-white/5 border border-border">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground italic">
                                {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                <Accordion type="single" collapsible className="border-t border-border">
                    <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:no-underline hover:text-foreground transition-colors">
                            Détails du Festin
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3">
                            {order.plats.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item p-2.5 sm:p-3 rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                <span className="text-primary font-black italic text-[9px]">{item.quantite}</span>
                                            </div>
                                            <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground">{item.nom}</span>
                                        </div>
                                        {item.accompagnementSelectionne && (
                                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium tracking-wider ml-7 uppercase italic">
                                                + {item.accompagnementSelectionne.nom}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-xs sm:text-sm tracking-tight text-foreground">
                                        {item.prix.toLocaleString('fr-FR')} <span className="text-[9px] opacity-70">F</span>
                                    </span>
                                </div>
                            ))}
                            
                            {order.codePromo && (
                                <div className="flex justify-between items-center px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">
                                    <span>Code promo {order.codePromo.code}</span>
                                    <span>-{order.codePromo.montantReduction.toLocaleString('fr-FR')} F</span>
                                </div>
                            )}

                            <div className="pt-3 mt-1 border-t border-border space-y-2.5">
                                <div className="flex justify-between items-center px-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>Paiement</span>
                                    <span className={order.paiement.statut === 'echoue' ? 'text-rose-500' : order.paiement.statut === 'en_attente' ? 'text-amber-500' : 'text-emerald-500'}>
                                        {order.paiement.mode === 'especes'
                                            ? 'Espèces à la livraison'
                                            : `Mobile Money — ${
                                                order.paiement.statut === 'paye' ? 'payé'
                                                : order.paiement.statut === 'echoue' ? 'échoué'
                                                : 'en attente'
                                              }`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-primary/5 p-3.5 sm:p-4 rounded-2xl border border-primary/10 relative overflow-hidden group/revenue">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
                                    <div className="space-y-0.5 relative z-10">
                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Revenu Net Garanti</p>
                                        <p className="text-xl sm:text-2xl font-black italic tracking-tighter text-foreground">
                                            {order.revenuNet.toLocaleString('fr-FR')} <span className="text-[10px] opacity-70 normal-case font-bold ml-1">FCFA</span>
                                        </p>
                                    </div>
                                    <Receipt className="h-7 w-7 text-primary opacity-30 group-hover/revenue:opacity-50 transition-opacity" />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                    {canTransitionOrder(order.statut, 'En Préparation', 'restaurateur') && (
                        <Button
                            onClick={() => handleAcceptOrder(order)}
                            disabled={isUpdating === order.id}
                            className="flex-1 h-10 sm:h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-black italic uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-95 shadow-md shadow-primary/20 text-xs border-none"
                        >
                            {isUpdating === order.id ? <Loader className="h-4 w-4 animate-spin" /> : <ChefHat className="mr-2 w-4 h-4" />}
                            Lancer la Préparation
                        </Button>
                    )}
                    {order.statut === 'En Préparation' && (
                        <QrCodeDialog orderId={order.id}>
                            <Button className="flex-1 h-10 sm:h-11 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-black rounded-xl font-black italic uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-95 text-xs shadow-md">
                               <QrCode className="mr-2 w-4 h-4 text-primary"/>
                               Valider Livraison
                            </Button>
                        </QrCodeDialog>
                    )}
                </div>
            </div>
            
            {/* Background Decor */}
            <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-transparent pb-10 sm:pb-16 relative overflow-hidden">

            {/* Elite Command Header */}
            <div className="relative py-4 sm:py-6 md:py-8 w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    {!bgImageFailed && (
                        <Image
                            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
                            alt=""
                            fill
                            className="object-cover opacity-5 scale-110 animate-slow-zoom"
                            onError={() => setBgImageFailed(true)}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 z-10" />
                </div>
                
                <div className="relative z-30 text-center space-y-1.5 sm:space-y-2 px-3 sm:px-6 max-w-3xl pt-1 sm:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-2xl shadow-sm"
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] text-primary uppercase">Live Operations Room</span>
                    </motion.div>
                    
                    <div className="space-y-0.5">
                        <motion.h1 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground italic leading-none uppercase"
                        >
                            Flux <span className="text-primary">Elite</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-muted-foreground font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.25em]"
                        >
                            Orchestration en temps réel de votre excellence culinaire
                        </motion.p>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center items-center gap-5 sm:gap-10 mt-2 sm:mt-3"
                    >
                        <div className="text-center group cursor-default">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Nouveaux</p>
                            <p className="text-xl sm:text-3xl font-black text-foreground tracking-tighter group-hover:scale-105 transition-transform duration-300">{newOrders.length}</p>
                        </div>
                        <div className="w-px h-6 sm:h-8 bg-border self-center rotate-12" />
                        <div className="text-center group cursor-default">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-emerald-500 transition-colors">Cuisine</p>
                            <p className="text-xl sm:text-3xl font-black text-foreground tracking-tighter group-hover:scale-105 transition-transform duration-300">{preparingOrders.length}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-3 sm:px-6 max-w-5xl mt-2 sm:mt-4 relative z-40">
                {/* Mobile Header Correction */}
                <div className="md:hidden flex justify-start mb-3 sm:mb-4">
                    <MobileBackButton href="/restaurateur" label="Tableau de Bord" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
                    {/* New Orders Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="h-5 sm:h-7 w-1.5 bg-primary rounded-full shrink-0" />
                            <h2 className="text-lg sm:text-2xl font-black italic tracking-tighter text-foreground uppercase">
                                Nouvelles <span className="text-primary italic">Entrées</span>
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-[10px] sm:text-xs">
                                {newOrders.length}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                            <AnimatePresence mode="popLayout">
                                {newOrders.length > 0 ? (
                                    newOrders.map(order => <OrderCard key={order.id} order={order} />)
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="relative group overflow-hidden bg-card/80 border border-border backdrop-blur-xl p-5 sm:p-7 md:p-8 text-center flex flex-col items-center justify-center transition-all duration-300 rounded-xl sm:rounded-2xl shadow-sm"
                                    >
                                        <div className="relative mb-3">
                                            <div className="absolute inset-0 bg-primary/10 blur-[25px] rounded-full scale-125" />
                                            <div className="relative h-11 w-11 sm:h-12 sm:w-12 bg-muted/50 border border-border flex items-center justify-center rounded-xl backdrop-blur-md">
                                                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-foreground italic">Calme Plat</p>
                                            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground max-w-xs leading-relaxed">Le silence avant la tempête culinaire. Aucune nouvelle commande.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {/* Preparing Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="h-5 sm:h-7 w-1.5 bg-emerald-500 rounded-full shrink-0" />
                            <h2 className="text-lg sm:text-2xl font-black italic tracking-tighter text-foreground uppercase">
                                Atelier <span className="text-emerald-500 italic">Culinaire</span>
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs">
                                {preparingOrders.length}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            <AnimatePresence mode="popLayout">
                                {preparingOrders.length > 0 ? (
                                    preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="relative group overflow-hidden bg-card/80 border border-border backdrop-blur-xl p-5 sm:p-7 md:p-8 text-center flex flex-col items-center justify-center transition-all duration-300 rounded-xl sm:rounded-2xl shadow-sm"
                                    >
                                        <div className="relative mb-3">
                                            <div className="absolute inset-0 bg-emerald-500/10 blur-[25px] rounded-full scale-125" />
                                            <div className="relative h-11 w-11 sm:h-12 sm:w-12 bg-muted/50 border border-border flex items-center justify-center rounded-xl backdrop-blur-md">
                                                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-300" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-foreground italic">Plan de Travail Prêt</p>
                                            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground max-w-xs leading-relaxed">Toutes les préparations en cours ont été finalisées.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-8 sm:mt-12 text-center opacity-40 group hover:opacity-100 transition-all duration-500 pb-4">
                    <div className="h-px w-20 sm:w-24 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent mx-auto mb-3 sm:mb-4" />
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">
                        Yakro Ops Elite Framework v4.2 &bull; Secure Flux
                    </p>
                </div>
            </div>
        </div>
    );
}
