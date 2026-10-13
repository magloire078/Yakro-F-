'use client';

import * as React from 'react';
import { 
    LayoutList, 
    Map as MapIcon, 
    Search, 
    Filter, 
    MoreHorizontal, 
    Clock, 
    Bike, 
    Utensils, 
    AlertCircle,
    Navigation2,
    Activity,
    Target,
    Maximize2,
    Store,
    Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useData } from '@/contexts/data-context';
import { Order } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { OperationsMap } from '@/components/map/operations-map';

export type OrderFocusRequest = { orderId: string; requestedAt: number };

export function SupervisionModule({ focusRequest }: { focusRequest?: OrderFocusRequest | null } = {}) {
    const { orders, restaurants } = useData();
    const [view, setView] = React.useState<'list' | 'map'>('list');
    const [searchTerm, setSearchTerm] = React.useState('');

    // Une alerte admin ("Intervenir") demande de cibler une commande :
    // on bascule sur la liste filtrée sur son identifiant.
    React.useEffect(() => {
        if (!focusRequest) return;
        setView('list');
        setSearchTerm(focusRequest.orderId);
    }, [focusRequest]);
    const [events, setEvents] = React.useState<{ id: string; msg: string; time: Date; type: 'departure' | 'arrival' | 'preparation' }[]>([]);

    // Simuler des événements en direct basés sur les commandes
    React.useEffect(() => {
        if (orders.length === 0) return;
        
        const possibleMsgs = [
            "Unité #TX-{id} vient de quitter le Bastion {restau}",
            "Commande #{id} est désormais en phase de transit Alpha",
            "Bastion {restau} a finalisé la préparation de l'unité #{id}",
            "Alerte: Flux critique détecté sur le secteur {restau}"
        ];

        const interval = setInterval(() => {
            const randomOrder = orders[Math.floor(Math.random() * orders.length)];
            const msg = possibleMsgs[Math.floor(Math.random() * possibleMsgs.length)]
                .replace('{id}', randomOrder.id.slice(-4).toUpperCase())
                .replace('{restau}', randomOrder.nomRestaurant);
            
            setEvents(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                msg,
                time: new Date(),
                type: (Math.random() > 0.5 ? 'departure' : 'preparation') as 'departure' | 'preparation'
            }, ...prev].slice(0, 10));
        }, 5000);

        return () => clearInterval(interval);
    }, [orders]);

    const activeOrders = React.useMemo(() => {
        return orders.filter(o => o.statut !== 'Livrée' && o.statut !== 'Annulée');
    }, [orders]);

    const filteredOrders = React.useMemo(() => {
        return activeOrders.filter(o => 
            o.nomRestaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activeOrders, searchTerm]);

    return (
        <Card className="border-none shadow-2xl glass rounded-none overflow-hidden border-t border-foreground/5 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary z-50" />
            
            <CardHeader className="p-6 border-b border-foreground/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Navigation2 className="h-5 w-5 text-primary fill-primary/20" />
                            </div>
                            <CardTitle className="text-2xl font-headline font-bold text-foreground dark:text-white">
                                Radar <span className="text-primary">Opérationnel</span>
                            </CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground font-body text-xs uppercase tracking-widest">
                            Flux global: {activeOrders.length} unités en transit actif.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-1 bg-foreground/5 p-1 border border-foreground/10">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setView('list')}
                            className={cn(
                                "h-10 px-6 rounded-none font-headline font-bold uppercase tracking-wider text-[11px] transition-all",
                                view === 'list' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                            )}
                        >
                            <LayoutList className="h-4 w-4 mr-2" />
                            Matrice
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setView('map')}
                            className={cn(
                                "h-10 px-6 rounded-none font-headline font-bold uppercase tracking-wider text-[11px] transition-all",
                                view === 'map' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                            )}
                        >
                            <MapIcon className="h-4 w-4 mr-2" />
                            Tactique
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="p-4 bg-foreground/[0.03] border-b border-foreground/5 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input 
                            placeholder="INTERCEPTER UNITÉ OU BASTION..." 
                            className="h-11 pl-14 bg-foreground/5 border-foreground/5 rounded-none font-body uppercase tracking-wider text-xs placeholder:text-muted-foreground text-foreground dark:text-white focus:ring-primary/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" aria-label="Filtrer les commandes" className="h-11 w-11 rounded-none bg-foreground/5 border-foreground/5 hover:bg-foreground/10 text-foreground dark:text-white">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <div className="min-h-[400px] md:min-h-[600px] relative">
                    <AnimatePresence mode="wait">
                        {view === 'list' ? (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="divide-y divide-foreground/5"
                            >
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order, idx) => (
                                        <OrderListItem key={order.id} order={order} index={idx} />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                                        <Activity className="h-16 w-16 mb-6 opacity-20 animate-pulse" />
                                        <p className="font-headline text-xs font-bold uppercase tracking-widest opacity-50">Secteur Pacifié: Aucun flux détecté</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="map"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-[420px] md:h-[650px] relative bg-background/40 overflow-hidden flex"
                            >
                                <div className="flex-1 relative">
                                    <OperationsMap restaurants={restaurants} orders={filteredOrders} livreurScope="all" className="absolute inset-0" />
                                </div>
                                <div className="hidden md:flex w-80 border-l border-foreground/5 glass overflow-hidden flex-col">
                                    <div className="p-4 border-b border-foreground/5">
                                        <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Flux d&apos;Événements Live</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                                        <AnimatePresence initial={false}>
                                            {events.map(event => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 bg-foreground/5 border border-foreground/5 rounded-none group hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-[10px] font-body font-medium uppercase tracking-tight text-muted-foreground group-hover:text-foreground dark:group-hover:text-white transition-colors leading-relaxed">
                                                        {event.msg}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
            
            <div className="p-4 bg-foreground/[0.03] flex justify-between items-center border-t border-foreground/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        <span className="text-[10px] font-body font-bold text-muted-foreground uppercase tracking-[0.2em]">TRANSMISSION TEMPS RÉEL ACTIVE</span>
                    </div>
                </div>
                <span className="text-[10px] font-headline font-bold text-muted-foreground uppercase tracking-widest">YAKRO COMMAND CENTER v4.0</span>
            </div>
        </Card>
    );
}

function OrderListItem({ order, index }: { order: Order, index: number }) {
    const statusInfo = {
        'Placée': { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock, label: 'ATTENTE' },
        'En Préparation': { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: Utensils, label: 'CUISINE' },
        'Prête': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Package, label: 'PRÊTE' },
        'En Route': { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Bike, label: 'TRANSIT' },
    };

    const currentStatus = statusInfo[order.statut as keyof typeof statusInfo] || statusInfo['Placée'];
    const StatusIcon = currentStatus.icon;

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="p-4 md:p-5 hover:bg-foreground/5 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 h-full w-1 bg-foreground/5 group-hover:bg-primary transition-colors" />
            
            <div className="flex items-center justify-between gap-3 md:gap-10">
                <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
                    <div className={cn("h-10 w-10 md:h-12 md:w-12 shrink-0 flex items-center justify-center border group-hover:scale-105 transition-transform", currentStatus.bg, currentStatus.border)}>
                        <StatusIcon className={cn("h-5 w-5 md:h-6 md:w-6", currentStatus.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                             <span className="text-base md:text-lg font-headline font-bold text-foreground tracking-tight">#{order.id.slice(-6).toUpperCase()}</span>
                             <Badge className={cn("rounded-none text-[10px] font-headline font-bold px-3 py-1 border", currentStatus.bg, currentStatus.border, currentStatus.color)}>
                                 {currentStatus.label}
                             </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-body font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                            <Link 
                                href={`/restaurants?id=${order.restaurantId}`}
                                className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors"
                            >
                                <Store className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                                <span className="truncate">{order.nomRestaurant}</span>
                            </Link>
                            <span className="hidden sm:inline opacity-20">|</span>
                            <span className="text-primary font-headline">{(order.total || 0).toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end gap-3 min-w-[200px]">
                    <div className="flex items-center gap-2 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary/50" />
                         DÉLAI: {formatDistanceToNow(new Date(order.date), { locale: fr, addSuffix: true })}
                    </div>
                    <div className="h-1.5 w-full bg-foreground/5 overflow-hidden border border-foreground/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                                width: order.statut === 'Placée' ? '20%' : 
                                       order.statut === 'En Préparation' ? '45%' : 
                                       order.statut === 'Prête' ? '70%' : '95%' 
                            }}
                            className={cn("h-full", currentStatus.color.replace('text', 'bg'))} 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <Button variant="ghost" size="icon" aria-label="Agrandir la vue" className="h-10 w-10 rounded-none hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20">
                        <Maximize2 className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Options de la commande" className="h-10 w-10 rounded-none hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" aria-label="Menu des opérations" className="w-64 glass border-foreground/10 rounded-none p-1 text-foreground">
                            <DropdownMenuItem asChild className="rounded-none gap-3 font-headline font-bold uppercase tracking-wider text-xs py-2.5 focus:bg-primary cursor-pointer">
                                <Link href={`/orders/track?id=${order.id}`}>
                                    <Navigation2 className="h-4 w-4" />
                                    Ouvrir Tracking
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-none gap-3 font-headline font-bold uppercase tracking-wider text-xs py-2.5 focus:bg-red-600 cursor-pointer">
                                <AlertCircle className="h-4 w-4" />
                                Alerte Retard
                            </DropdownMenuItem>
                            <div className="h-px bg-foreground/5 my-1" />
                            <DropdownMenuItem className="rounded-none gap-3 font-headline font-bold uppercase tracking-wider text-xs py-2.5 focus:bg-foreground/10 cursor-pointer text-muted-foreground">
                                <Target className="h-4 w-4" />
                                Logs Unité
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
}
