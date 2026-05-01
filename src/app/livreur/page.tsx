'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CurrentDelivery } from '@/components/current-delivery';
import { AvailableDeliveries } from '@/components/available-deliveries';
import { updateOrderStatusAction } from '@/app/actions/order-actions';

export default function LivreurHomePage() {
    const { user, userProfile, updateUserProfile } = useAuth();
    const { orders, isLoading } = useData();
    const [currentDelivery, setCurrentDelivery] = React.useState<Order | null>(null);
    const { toast } = useToast();
    
    React.useEffect(() => {
        if (user) {
            const activeOrder = orders.find(o => o.livreurId === user.uid && o.statut === 'En Route');
            setCurrentDelivery(activeOrder || null);
        }
    }, [orders, user]);

    const handleAcceptDelivery = async (delivery: Order) => {
        if (!user) return;
        
        try {
            await updateOrderStatusAction({
                orderId: delivery.id,
                status: 'En Route',
                delivererId: user.uid,
                orderData: delivery
            });
            toast({
                title: "Course acceptée !",
                description: `Vous allez livrer la commande de ${delivery.nomRestaurant}.`,
            });
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible d\'accepter la course.',
            });
        }
    };

    const handleCompleteDelivery = async () => {
        if (!currentDelivery) return;
        
        try {
            await updateOrderStatusAction({
                orderId: currentDelivery.id,
                status: 'Livrée',
                orderData: currentDelivery
            });
            toast({
                title: "Livraison terminée !",
                description: `Bien joué !`,
            });
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de terminer la livraison.',
            });
        }
    }

    if (currentDelivery) {
        return (
            <CurrentDelivery 
                order={currentDelivery} 
                onCompleteDelivery={handleCompleteDelivery}
            />
        )
    }

    return (
        <AvailableDeliveries
            orders={orders}
            isLoading={isLoading}
            userProfile={userProfile}
            onUpdateUserProfile={async (uid, data) => { await updateUserProfile(uid, data); }}
            onAcceptDelivery={handleAcceptDelivery}
            userId={user?.uid}
        />
    );
}
