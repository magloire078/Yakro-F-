
'use client';

import * as React from 'react';
import { OrderHistoryItem } from "@/components/order-history-item";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrdersPage() {
    const { user } = useAuth();
    const { orders } = useData();

    const userOrders = React.useMemo(() => {
        if (!user) return [];
        return orders.filter(o => o.userId === user.uid);
    }, [orders, user]);
    
    if (!user) {
         return (
             <div className="flex h-full w-full items-center justify-center text-center">
                <div>
                    <p className="text-lg font-medium text-muted-foreground">Veuillez vous connecter pour voir votre historique.</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">Se connecter</Link>
                    </Button>
                </div>
            </div>
         )
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Cinematic Header */}
            <div className="relative h-[25vh] w-full overflow-hidden flex items-center justify-center mb-8">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
                </div>
                <div className="relative z-30 text-center space-y-2 px-6">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white italic drop-shadow-2xl">
                        Historique <span className="text-orange-500">Commandes</span>
                    </h1>
                    <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-orange-200/80">
                        Elite Dining Tracking
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="space-y-8">
                    {userOrders.length > 0 ? (
                        userOrders.map(order => (
                            <OrderHistoryItem key={order.id} order={order} />
                        ))
                    ) : (
                        <div className="text-center py-24 glass rounded-[3rem] border-white/5 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="p-8 rounded-full bg-orange-500/10 border border-orange-500/20">
                                <History className="w-16 h-16 text-orange-500 animate-pulse"/>
                            </div>
                            <div className="space-y-2">
                                <p className="text-2xl font-black uppercase tracking-tighter">Silence Gastronomique</p>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-60">Votre table est encore vide</p>
                            </div>
                            <Button asChild className="rounded-2xl glass-orange text-white font-black uppercase tracking-widest px-10 h-14 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-orange-500/20">
                                <Link href="/">Explorer la Carte</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
