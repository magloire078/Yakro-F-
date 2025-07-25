
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, MapPin, Package, Clock, Phone, Bike } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


// Mock data for Active Delivery - we can make this dynamic later
const ActiveDelivery = {
    id: 'del3',
    restaurantName: 'Le Bazin',
    restaurantAddress: 'II Plateaux Vallon',
    customerAddress: 'Riviera Palmeraie',
    status: 'En cours',
    items: ['Foutou Banane', 'Alloco'],
    customerPhone: '07 01 02 03 04',
};


export default function DeliveryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { orders, isLoading, updateOrderStatus } = useData();
    const [currentDelivery, setCurrentDelivery] = React.useState<any>(null);
    const { toast } = useToast();
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [isCompleting, setIsCompleting] = React.useState(false);


    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const availableDeliveries = React.useMemo(() => {
        return orders.filter(o => o.status === 'Placée');
    }, [orders]);

    const handleAcceptDelivery = async (delivery: Order) => {
        setIsAccepting(delivery.id);
        try {
            // This is the key change: update status in Firestore
            await updateOrderStatus(delivery.id, 'En Route');
            
            const activeDeliveryDetails = {
                id: delivery.id,
                restaurantName: delivery.restaurantName,
                restaurantAddress: 'Rue des Jardins, Cocody', // Mocked, would come from restaurant data
                customerAddress: 'Angré 7ème Tranche', // Mocked, would come from user profile
                status: 'En Route',
                items: delivery.items.map(i => i.name),
                customerPhone: '07 01 02 03 04', // Mocked
            };
            setCurrentDelivery(activeDeliveryDetails);
            toast({
                title: "Course acceptée !",
                description: `Vous allez livrer la commande de ${delivery.restaurantName}.`,
            });
        } catch(error) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'accepter cette course pour le moment.",
            });
        } finally {
            setIsAccepting(null);
        }
    };

    const handleCompleteDelivery = async () => {
        if (!currentDelivery) return;
        setIsCompleting(true);
        try {
            await updateOrderStatus(currentDelivery.id, 'Livrée');
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
        } finally {
            setIsCompleting(false);
        }
    }

    if (authLoading || !user || isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    if (currentDelivery) {
        return (
            <div className="container mx-auto">
                <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Livraison en cours</h1>
                <Card className="bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <span>Commande pour {currentDelivery.customerAddress}</span>
                           <Badge variant="default">En cours</Badge>
                        </CardTitle>
                        <CardDescription>Du restaurant : {currentDelivery.restaurantName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <MapPin className="text-primary"/>
                                <div>
                                    <p className="font-semibold">Récupérer à</p>
                                    <p>{currentDelivery.restaurantAddress}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <MapPin className="text-green-500"/>
                                <div>
                                    <p className="font-semibold">Livrer à</p>
                                    <p>{currentDelivery.customerAddress}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4 space-y-2">
                             <div className="flex items-center gap-4">
                                <Package className="text-muted-foreground"/>
                                <p>Contenu: {currentDelivery.items.join(', ')}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Phone className="text-muted-foreground"/>
                                <p>Client: {currentDelivery.customerPhone}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button className="w-full" size="lg" onClick={handleCompleteDelivery} disabled={isCompleting}>
                                {isCompleting && <Loader className="animate-spin mr-2" />}
                                Marquer comme livré
                            </Button>
                            <Button variant="outline" className="w-full" size="lg">Problème ?</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Courses disponibles</h1>
            <div className="space-y-4">
                {availableDeliveries.map(delivery => (
                    <Card key={delivery.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           <div className="flex-1">
                             <p className="font-bold">{delivery.restaurantName}</p>
                             <p className="text-sm text-muted-foreground">Commande passée le {new Date(delivery.date).toLocaleTimeString('fr-FR')}</p>
                           </div>
                           <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Package className="w-4 h-4"/>
                                    <span>{delivery.items.length} article(s)</span>
                                </div>
                                <Badge variant="secondary" className="text-base">{delivery.total.toLocaleString('fr-FR')} FCFA</Badge>
                           </div>
                           <Button onClick={() => handleAcceptDelivery(delivery)} disabled={isAccepting !== null}>
                             {isAccepting === delivery.id && <Loader className="animate-spin mr-2"/>}
                             Accepter
                           </Button>
                        </CardContent>
                    </Card>
                ))}
                 {availableDeliveries.length === 0 && !currentDelivery && (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                        <Bike className="w-16 h-16"/>
                        <p className="text-lg font-medium">Aucune course disponible</p>
                        <p>Revenez plus tard pour de nouvelles opportunités de livraison.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
