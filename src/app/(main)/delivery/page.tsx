
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, Phone, Bike, Home, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


export default function DeliveryPage() {
    const { user, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const { orders, isLoading, updateOrderStatus } = useData();
    const [currentDelivery, setCurrentDelivery] = React.useState<Order | null>(null);
    const { toast } = useToast();
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [isCompleting, setIsCompleting] = React.useState(false);
    
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && activeRole !== 'livreur') {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Veuillez sélectionner le profil "Livreur" pour accéder à cette page.',
            })
            router.push('/profile-selection');
        }
    }, [user, authLoading, router, activeRole, toast]);

    const availableDeliveries = React.useMemo(() => {
        return orders.filter(o => o.status === 'En Préparation');
    }, [orders]);
    
    // Check if the current user has an active delivery
    React.useEffect(() => {
        if (user) {
            const activeOrder = orders.find(o => o.delivererId === user.uid && o.status === 'En Route');
            setCurrentDelivery(activeOrder || null);
        }
    }, [orders, user]);

    const handleAcceptDelivery = async (delivery: Order) => {
        if (!user) return;
        setIsAccepting(delivery.id);
        try {
            await updateOrderStatus(delivery.id, 'En Route', user.uid);
            setCurrentDelivery({ ...delivery, status: 'En Route', delivererId: user.uid });
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

    if (authLoading || isLoading || !user || activeRole !== 'livreur') {
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
                           <span>Commande n°{currentDelivery.id.slice(0, 5)}...</span>
                           <Badge variant="default">En cours</Badge>
                        </CardTitle>
                        <CardDescription>Récupérez et livrez la commande suivante.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 border-b pb-4">
                            <div className="flex items-start gap-4">
                                <ChefHat className="text-primary mt-1"/>
                                <div>
                                    <p className="font-semibold text-lg">1. Récupérer chez {currentDelivery.restaurantName}</p>
                                    <p className="text-muted-foreground">{currentDelivery.restaurantAddress}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-4">
                                <Home className="text-green-500 mt-1"/>
                                <div>
                                    <p className="font-semibold text-lg">2. Livrer à</p>
                                    <p className="text-muted-foreground">{currentDelivery.customerAddress}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <div className="flex items-center gap-4">
                                <p>Contenu : {currentDelivery.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Phone className="text-muted-foreground"/>
                                <p>Client : {currentDelivery.customerPhone}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                            <Button className="w-full" size="lg" onClick={handleCompleteDelivery} disabled={isCompleting}>
                                {isCompleting && <Loader className="animate-spin mr-2" />}
                                Marquer comme livré
                            </Button>
                            <Button variant="outline" className="w-full" size="lg">Signaler un problème</Button>
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
                {availableDeliveries.length > 0 ? availableDeliveries.map(delivery => (
                    <Card key={delivery.id}>
                        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                           <div className="md:col-span-1">
                             <p className="font-bold text-lg">{delivery.restaurantName}</p>
                             <p className="text-sm text-muted-foreground">De: {delivery.restaurantAddress}</p>
                             <p className="text-sm text-muted-foreground">À: {delivery.customerAddress}</p>
                           </div>
                           <div className="md:col-span-1 flex flex-row md:flex-col items-start md:items-center justify-between gap-2 text-sm">
                                <Badge variant="secondary" className="text-base font-bold">{delivery.total.toLocaleString('fr-FR')} FCFA</Badge>
                                <div className="flex items-center gap-2">
                                    <span>{delivery.items.length} article(s)</span>
                                </div>
                           </div>
                           <div className="md:col-span-1 flex justify-start md:justify-end">
                               <Button onClick={() => handleAcceptDelivery(delivery)} disabled={isAccepting !== null} size="lg">
                                 {isAccepting === delivery.id && <Loader className="animate-spin mr-2"/>}
                                 Accepter la course
                               </Button>
                           </div>
                        </CardContent>
                    </Card>
                )) : null}
                 {availableDeliveries.length === 0 && !currentDelivery && (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4 bg-card rounded-lg">
                        <Bike className="w-16 h-16"/>
                        <p className="text-lg font-medium">Aucune course disponible pour le moment</p>
                        <p>Les commandes prêtes à être livrées apparaîtront ici.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
