'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader, QrCode, UtensilsCrossed, Clock, Receipt, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QrCodeDialog } from '@/components/qr-code-dialog';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { motion, AnimatePresence } from 'framer-motion';

import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

export default function DashboardOrdersPage() {
    const { user, activeRole } = useAuth();
    const { orders, restaurants } = useData();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

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
            className="group relative glass-dark border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/50 hover:shadow-orange-500/10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl"
        >
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${
                order.statut === 'Placée' ? 'bg-orange-500' : 'bg-emerald-500'
            }`} />
            
            <div className="p-4 md:p-5">
                <div className="flex justify-between items-start mb-5">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Elite Order</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-black italic tracking-tighter text-foreground group-hover:text-orange-500 transition-colors uppercase leading-none break-words">
                            {order.nomRestaurant}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <Badge variant="outline" className={`rounded-full px-4 py-1 font-black uppercase text-[9px] tracking-widest border-2 ${
                            order.statut === 'Placée' 
                                ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' 
                                : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                        }`}>
                            {order.statut === 'Placée' ? 'Nouveau' : 'En Cuisine'}
                        </Badge>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground/5 border border-foreground/5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-black text-muted-foreground italic">
                                {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                <Accordion type="single" collapsible className="border-t border-foreground/5">
                    <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:no-underline hover:text-foreground transition-colors">
                            Détails du Festin
                        </AccordionTrigger>
                        <AccordionContent className="space-y-5 pb-6">
                            {order.plats.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.04] transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <span className="text-orange-500 font-black italic text-[10px]">{item.quantite}</span>
                                            </div>
                                            <span className="font-black text-xs md:text-sm tracking-tight text-foreground">{item.nom}</span>
                                        </div>
                                        {item.accompagnementSelectionne && (
                                            <span className="text-[9px] text-muted-foreground font-bold tracking-widest ml-9 uppercase italic">
                                                + {item.accompagnementSelectionne.nom}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-sm tracking-tighter text-muted-foreground">
                                        {item.prix.toLocaleString('fr-FR')} <span className="text-[9px] opacity-40">F</span>
                                    </span>
                                </div>
                            ))}
                            
                            <div className="pt-6 mt-2 border-t border-foreground/5">
                                <div className="flex justify-between items-center bg-orange-500/5 p-5 rounded-3xl border border-orange-500/10 relative overflow-hidden group/revenue">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                                    <div className="space-y-1 relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500/60">Revenu Net Garanti</p>
                                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-foreground">
                                            {order.revenuNet.toLocaleString('fr-FR')} <span className="text-[12px] opacity-40 normal-case font-bold ml-1">FCFA</span>
                                        </p>
                                    </div>
                                    <Receipt className="h-10 w-10 text-orange-500 opacity-20 group-hover/revenue:opacity-40 transition-opacity" />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {order.statut === 'Placée' && (
                        <Button 
                            onClick={() => handleAcceptOrder(order)} 
                            disabled={isUpdating === order.id} 
                            className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black italic uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-orange-500/20 text-[11px] border-none"
                        >
                            {isUpdating === order.id ? <Loader className="h-5 w-5 animate-spin" /> : <ChefHat className="mr-3 w-5 h-5" />}
                            Lancer la Préparation
                        </Button>
                    )}
                    {order.statut === 'En Préparation' && (
                        <QrCodeDialog orderId={order.id}>
                            <Button className="flex-1 h-11 bg-white hover:bg-gray-100 text-black rounded-xl font-black italic uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.02] active:scale-95 text-[11px] shadow-2xl">
                               <QrCode className="mr-3 w-5 h-5 text-orange-500"/>
                               Valider Livraison
                            </Button>
                        </QrCodeDialog>
                    )}
                </div>
            </div>
            
            {/* Background Decor */}
            <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-orange-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );

    return (
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />,
                badgeText: "Live Operations Room",
                title: <>Flux <span className="text-orange-500 italic">Elite</span></>,
                subtitle: "Orchestration en temps réel de votre excellence culinaire",
                children: (
                    <DashboardStats 
                        items={[
                            { label: "Nouveaux", value: newOrders.length, color: "orange" },
                            { label: "Cuisine", value: preparingOrders.length, color: "emerald" }
                        ]}
                    />
                )
            }}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* New Orders Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="h-10 w-1.5 bg-orange-500 rounded-full" />
                        <h2 className="text-xl md:text-2xl font-black italic tracking-tighter text-foreground uppercase">
                            Nouvelles <span className="text-orange-500 italic">Entrées</span>
                        </h2>
                        <div className="h-px flex-1 bg-foreground/5" />
                    </div>
                    
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {newOrders.length > 0 ? (
                                newOrders.map(order => <OrderCard key={order.id} order={order} />)
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative group overflow-hidden glass-dark border border-white/5 p-16 md:p-24 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-orange-500/20 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl"
                                >
                                    <div className="relative mb-10">
                                        <div className="absolute inset-0 bg-orange-500/10 blur-[50px] rounded-full scale-150 animate-pulse" />
                                        <div className="relative h-24 w-24 bg-foreground/5 border border-foreground/10 flex items-center justify-center rounded-[2rem] backdrop-blur-2xl">
                                            <UtensilsCrossed className="w-10 h-10 text-muted-foreground group-hover:text-orange-500 transition-colors duration-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Calme Plat</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] leading-relaxed">Le silence avant la tempête culinaire. Aucune nouvelle commande.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                
                {/* Preparing Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="h-10 w-1.5 bg-emerald-500 rounded-full" />
                        <h2 className="text-xl md:text-2xl font-black italic tracking-tighter text-foreground uppercase">
                            Atelier <span className="text-emerald-500 italic">Culinaire</span>
                        </h2>
                        <div className="h-px flex-1 bg-foreground/5" />
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {preparingOrders.length > 0 ? (
                                preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative group overflow-hidden glass-dark border border-white/5 p-16 md:p-24 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-emerald-500/20 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl"
                                >
                                    <div className="relative mb-10">
                                        <div className="absolute inset-0 bg-emerald-500/10 blur-[50px] rounded-full scale-150" />
                                        <div className="relative h-24 w-24 bg-foreground/5 border border-foreground/10 flex items-center justify-center rounded-[2rem] backdrop-blur-2xl">
                                            <ChefHat className="w-10 h-10 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Plan de Travail Prêt</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] leading-relaxed">Toutes les préparations en cours ont été finalisées.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {/* Branding Footer removed - now integrated in DashboardPage */}
        </DashboardPage>
    );
}
