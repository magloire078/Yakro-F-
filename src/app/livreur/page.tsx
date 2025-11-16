'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { CurrentDelivery } from '@/components/current-delivery';
import { AvailableDeliveries } from '@/components/available-deliveries';

export default function LivreurHomePage() {
    const { user, userProfile, updateUserProfile } = useAuth();
    const { orders, isLoading } = useData();
    const [currentDelivery, setCurrentDelivery] = React.useState<Order | null>(null);
    const { toast } = useToast();
    
    // Check if the current user has an active delivery
    React.useEffect(() => {
        if (user) {
            const activeOrder = orders.find(o => o.livreurId === user.uid && o.statut === 'En Route');
            setCurrentDelivery(activeOrder || null);
        }
    }, [orders, user]);

    const handleAcceptDelivery = async (delivery: Order) => {
        if (!user) return;
        try {
            await updateOrderStatusAction({ orderId: delivery.id, status: 'En Route', delivererId: user.uid });
            setCurrentDelivery({ ...delivery, statut: 'En Route', livreurId: user.uid });
            toast({
                title: "Course acceptée !",
                description: `Vous allez livrer la commande de ${delivery.nomRestaurant}.`,
            });
        } catch(error) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'accepter cette course pour le moment.",
            });
        }
    };

    const handleCompleteDelivery = async () => {
        if (!currentDelivery) return;
        try {
            await updateOrderStatusAction({ orderId: currentDelivery.id, status: 'Livrée' });
            setCurrentDelivery(null);
            toast({
                title: "Livraison terminée !",
                description: `Bien joué !`,
            });
        } catch(error) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de marquer cette course comme livrée.",
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
            onUpdateUserProfile={updateUserProfile}
            onAcceptDelivery={handleAcceptDelivery}
            userId={user?.uid}
        />
    );
}
