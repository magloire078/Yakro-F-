
'use client';

import * as React from 'react';
import { OrderHistoryItem } from "@/components/order-history-item";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from 'next/navigation';
import { Loader, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrdersPage() {
    const { user } = useAuth();
    const { orders } = useData();
    const router = useRouter();

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
        <div className="container mx-auto">
            <h1 className="text-2xl md:text-3xl font-headline text-primary mb-8">Historique des commandes</h1>
            <div className="space-y-6">
                {userOrders.length > 0 ? (
                    userOrders.map(order => (
                        <OrderHistoryItem key={order.id} order={order} />
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                        <History className="w-16 h-16"/>
                        <p className="text-lg font-medium">Aucune commande trouvée</p>
                        <p>Il semble que vous n'ayez pas encore commandé. Il est temps de vous régaler !</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Commencer à commander</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
