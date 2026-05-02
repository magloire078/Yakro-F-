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

import Image from 'next/image';
import { MobileBackButton } from '@/components/mobile-back-button';

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
            className="group relative bg-[#121214]/60 backdrop-blur-xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10"
        >
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-500 ${
                order.statut === 'Placée' ? 'bg-orange-500' : 'bg-green-500'
            }`} />
            
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Commande Elite</span>
                            <span className="text-[10px] font-bold text-gray-500">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-white group-hover:text-orange-500 transition-colors uppercase">
                            {order.nomRestaurant}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={`rounded-none px-3 py-1 font-black uppercase text-[9px] tracking-widest border ${
                            order.statut === 'Placée' 
                                ? 'border-orange-500/20 text-orange-500 bg-orange-500/5' 
                                : 'border-green-500/20 text-green-500 bg-green-500/5'
                        }`}>
                            {order.statut === 'Placée' ? 'Nouv.' : 'Cuisine'}
                        </Badge>
                        <span className="text-[10px] font-bold text-gray-500 italic">
                            {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <Accordion type="single" collapsible className="border-t border-white/5">
                    <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:no-underline hover:text-white transition-colors">
                            Détails du Festin
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-4">
                            {order.plats.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-500 font-black italic text-xs">{item.quantite}x</span>
                                            <span className="font-bold text-xs md:text-sm tracking-tight text-gray-300">{item.nom}</span>
                                        </div>
                                        {item.accompagnementSelectionne && (
                                            <span className="text-[9px] text-gray-500 font-bold tracking-widest ml-6 uppercase">
                                                + {item.accompagnementSelectionne.nom}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-black text-xs tracking-tighter text-gray-400">
                                        {item.prix.toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">F</span>
                                    </span>
                                </div>
                            ))}
                            
                            <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-orange-500">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Revenu Net</p>
                                        <p className="text-xl md:text-2xl font-black italic tracking-tighter">
                                            {order.revenuNet.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60 normal-case font-bold">FCFA</span>
                                        </p>
                                    </div>
                                    <Receipt className="h-6 w-6 opacity-20" />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="mt-8 flex gap-3">
                    {order.statut === 'Placée' && (
                        <Button 
                            onClick={() => handleAcceptOrder(order)} 
                            disabled={isUpdating === order.id} 
                            className="flex-1 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-widest transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-orange-500/20 text-[10px]"
                        >
                            {isUpdating === order.id ? <Loader className="h-4 w-4 animate-spin" /> : <ChefHat className="mr-3 w-4 h-4" />}
                            Lancer la Préparation
                        </Button>
                    )}
                    {order.statut === 'En Préparation' && (
                        <QrCodeDialog orderId={order.id}>
                            <Button className="flex-1 h-14 bg-white hover:bg-gray-100 text-black rounded-none font-black italic uppercase tracking-widest transition-all duration-500 hover:scale-[1.02] text-[10px] shadow-xl">
                               <QrCode className="mr-3 w-4 h-4 text-orange-500"/>
                               Valider la Livraison
                            </Button>
                        </QrCodeDialog>
                    )}
                </div>
            </div>
            
            {/* Hover Decor */}
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden">
            {/* Elite Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1),transparent_70%)]" />
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Elite Command Header */}
            <div className="relative h-[40vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
                        alt="Kitchen Header"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent z-10" />
                </div>
                
                <div className="relative z-30 text-center space-y-6 px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl mb-2 shadow-xl"
                    >
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">Opérations en Direct</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-black tracking-tighter text-white italic leading-none uppercase"
                    >
                        Flux <span className="text-orange-500">Opérationnel</span>
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center gap-8 md:gap-12 mt-8"
                    >
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 group-hover:text-orange-500 transition-colors">Nouveaux</p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{newOrders.length}</p>
                        </div>
                        <div className="w-px h-10 md:h-12 bg-white/10 self-center" />
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 group-hover:text-green-500 transition-colors">Cuisine</p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{preparingOrders.length}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-10 relative z-40">
                <MobileBackButton />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-12">
                    {/* New Orders Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1 bg-orange-500" />
                            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                                Nouvelles <span className="text-orange-500 italic">Entrées</span>
                            </h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        
                        <div className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {newOrders.length > 0 ? (
                                    newOrders.map(order => <OrderCard key={order.id} order={order} />)
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="relative group overflow-hidden bg-[#121214]/40 backdrop-blur-xl border border-white/5 p-20 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-orange-500/20"
                                    >
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-orange-500/5 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative h-16 w-16 bg-white/5 border border-white/10 flex items-center justify-center">
                                                <UtensilsCrossed className="w-8 h-8 text-gray-700" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Silence en salle</p>
                                        <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase tracking-widest">Aucune nouvelle commande pour le moment.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {/* Preparing Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1 bg-green-500" />
                            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">
                                Atelier <span className="text-green-500 italic">Culinaire</span>
                            </h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="popLayout">
                                {preparingOrders.length > 0 ? (
                                    preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="relative group overflow-hidden bg-[#121214]/40 backdrop-blur-xl border border-white/5 p-20 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-green-500/20"
                                    >
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-green-500/5 blur-2xl rounded-full scale-150" />
                                            <div className="relative h-16 w-16 bg-white/5 border border-white/10 flex items-center justify-center">
                                                <ChefHat className="w-8 h-8 text-gray-700" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Cuisine Prête</p>
                                        <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase tracking-widest">Le poste de travail est disponible.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                
                {/* Branding Footer */}
                <div className="mt-24 text-center opacity-20 group hover:opacity-40 transition-opacity pb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 italic">
                        Yakro Ops Elite &bull; Flux de Performance
                    </p>
                </div>
            </div>
        </div>
    );
}
