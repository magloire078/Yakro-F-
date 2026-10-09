
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
        <div className="min-h-screen pb-16 sm:pb-24">
            {/* Cinematic Header */}
            <div className="relative h-[16vh] sm:h-[22vh] w-full overflow-hidden flex items-center justify-center mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
                </div>
                <div className="relative z-30 text-center space-y-1 px-4">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white italic drop-shadow-xl">
                        Historique <span className="text-primary">Commandes</span>
                    </h1>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary/80">
                        Suivi des repas d&apos;exception
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-1 sm:px-4 max-w-4xl">
                <div className="space-y-3 sm:space-y-6">
                    {userOrders.length > 0 ? (
                        userOrders.map(order => (
                            <OrderHistoryItem key={order.id} order={order} />
                        ))
                    ) : (
                        <div className="text-center py-12 sm:py-20 glass rounded-2xl sm:rounded-3xl border-border dark:border-white/5 flex flex-col items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="p-4 sm:p-6 rounded-full bg-primary/10 border border-primary/20">
                                <History className="w-10 h-10 sm:w-14 sm:h-14 text-primary animate-pulse"/>
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg sm:text-xl font-black uppercase tracking-tight">Silence Gastronomique</p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-70">Votre table est encore vide</p>
                            </div>
                            <Button asChild className="rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider px-6 sm:px-8 h-10 sm:h-12 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 text-xs sm:text-sm">
                                <Link href="/">Explorer la Carte</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
