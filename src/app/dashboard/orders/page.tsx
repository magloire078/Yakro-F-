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
    };    const OrderCard = ({ order }: { order: Order }) => (
        <div className="group relative bg-white/70 backdrop-blur-xl border border-white overflow-hidden transition-all duration-500 hover:border-orange-500/20 hover:shadow-2xl hover:shadow-slate-200/50 shadow-sm">
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-500 ${
                order.statut === 'Placée' ? 'bg-orange-500' : 'bg-green-500'
            }`} />
            
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600">Commande Elite</span>
                            <span className="text-[10px] font-bold text-slate-400">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-slate-900 group-hover:text-orange-500 transition-colors">
                            {order.nomRestaurant}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={`rounded-lg px-3 py-1 font-bold uppercase text-[9px] tracking-widest border ${
                            order.statut === 'Placée' 
                                ? 'border-orange-500/20 text-orange-600 bg-orange-50' 
                                : 'border-green-500/20 text-green-600 bg-green-50'
                        }`}>
                            {order.statut === 'Placée' ? 'Nouv.' : 'Cuisine'}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 italic">
                            {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <Accordion type="single" collapsible className="border-t border-slate-100">
                    <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:no-underline hover:text-slate-900 transition-colors">
                            Détails du Festin
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-4">
                            {order.plats.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-500 font-bold italic text-xs">{item.quantite}x</span>
                                            <span className="font-bold text-xs md:text-sm tracking-tight text-slate-700">{item.nom}</span>
                                        </div>
                                        {item.accompagnementSelectionne && (
                                            <span className="text-[9px] text-slate-400 font-bold tracking-widest ml-6">
                                                + {item.accompagnementSelectionne.nom}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-bold text-xs tracking-tighter text-slate-400">
                                        {(item.prix * item.quantite).toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">F</span>
                                    </span>
                                </div>
                            ))}
                            
                            <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                                <div className="flex justify-between items-center text-orange-600">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Revenu Net</p>
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
                            className="flex-1 h-14 md:h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold italic tracking-tight transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-slate-200 text-xs"
                        >
                            {isUpdating === order.id ? <Loader className="h-5 w-5 animate-spin" /> : <ChefHat className="mr-3 w-4 h-4 md:w-5 md:h-5" />}
                            Lancer la Préparation
                        </Button>
                    )}
                    {order.statut === 'En Préparation' && (
                        <QrCodeDialog orderId={order.id}>
                            <Button className="flex-1 h-14 md:h-16 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-bold italic tracking-tight transition-all duration-500 hover:scale-[1.02] text-xs shadow-sm">
                               <QrCode className="mr-3 w-4 h-4 md:w-5 md:h-5 text-orange-500"/>
                               Valider la Livraison
                            </Button>
                        </QrCodeDialog>
                    )}
                </div>
            </div>
            
            {/* Hover Decor */}
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-24 relative overflow-hidden">
            {/* Elite Platinum Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.08),transparent_70%)]" />
            <div className="absolute top-[-5%] left-[-10%] w-[800px] h-[800px] bg-slate-100/40 rounded-full blur-[140px] pointer-events-none" />

            {/* Elite Command Header */}
            <div className="relative h-[30vh] md:h-[40vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
                        alt="Kitchen Header"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-slate-50/60 z-10" />
                </div>
                
                <div className="relative z-30 text-center space-y-6 px-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-orange-500/10 backdrop-blur-xl mb-2 shadow-sm animate-fade-in-up">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-bold tracking-[0.15em] text-orange-600">Opérations en Direct</span>
                    </div>
                    <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-slate-900 italic leading-none animate-fade-in-up delay-100">
                        Flux <span className="text-orange-500">Opérationnel</span>
                    </h1>
                    
                    <div className="flex justify-center gap-8 md:gap-12 mt-8 animate-fade-in-up delay-200">
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 group-hover:text-orange-500 transition-colors">Nouveaux</p>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{newOrders.length}</p>
                        </div>
                        <div className="w-px h-10 md:h-12 bg-slate-200 self-center" />
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 group-hover:text-green-500 transition-colors">Cuisine</p>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{preparingOrders.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-8 md:-mt-10 relative z-40">
                <MobileBackButton />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* New Orders Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1 bg-orange-500" />
                            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">
                                Nouvelles <span className="text-orange-500 italic">Entrées</span>
                            </h2>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        
                        <div className="space-y-6">
                            {newOrders.length > 0 ? (
                                 newOrders.map(order => <OrderCard key={order.id} order={order} />)
                            ) : (
                                <div className="relative group overflow-hidden bg-white/50 backdrop-blur-xl border border-slate-100 p-20 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-orange-500/20 rounded-2xl">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
                                        <div className="relative h-16 w-16 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-xl">
                                            <UtensilsCrossed className="w-8 h-8 text-slate-300" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Silence en salle</p>
                                    <p className="text-xs font-medium text-slate-500 mt-2">Aucune nouvelle commande pour le moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Preparing Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1 bg-green-500" />
                            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">
                                Atelier <span className="text-green-500 italic">Culinaire</span>
                            </h2>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        <div className="space-y-6">
                            {preparingOrders.length > 0 ? (
                                 preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                            ) : (
                                <div className="relative group overflow-hidden bg-white/50 backdrop-blur-xl border border-slate-100 p-20 text-center flex flex-col items-center justify-center transition-all duration-500 hover:border-green-500/20 rounded-2xl">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-green-500/5 blur-2xl rounded-full scale-150" />
                                        <div className="relative h-16 w-16 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-xl">
                                            <ChefHat className="w-8 h-8 text-slate-300" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Cuisine Prête</p>
                                    <p className="text-xs font-medium text-slate-500 mt-2">Le poste de travail est disponible.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Visual Separator */}
                <div className="mt-20 flex justify-center opacity-10">
                    <div className="h-px w-64 bg-gradient-to-r from-transparent via-white to-transparent" />
                </div>
            </div>
        </div>
    );
}
