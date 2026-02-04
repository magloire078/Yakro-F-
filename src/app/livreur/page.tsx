'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CurrentDelivery } from '@/components/current-delivery';
import { AvailableDeliveries } from '@/components/available-deliveries';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LivreurHomePage() {
    const { user, userProfile, updateUserProfile } = useAuth();
    const { db } = useFirebase();
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
        const orderRef = doc(db, 'commandes', delivery.id);
        const updateData = { statut: 'En Route', livreurId: user.uid };

        updateDoc(orderRef, updateData)
            .then(() => {
                toast({
                    title: "Course acceptée !",
                    description: `Vous allez livrer la commande de ${delivery.nomRestaurant}.`,
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const handleCompleteDelivery = async () => {
        if (!currentDelivery) return;
        const orderRef = doc(db, 'commandes', currentDelivery.id);
        const updateData = { statut: 'Livrée' };

        updateDoc(orderRef, updateData)
            .then(() => {
                toast({
                    title: "Livraison terminée !",
                    description: `Bien joué !`,
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
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
