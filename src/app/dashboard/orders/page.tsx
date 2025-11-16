
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { updateOrderStatusAction } from '@/app/actions/order-actions';


export default function DashboardOrdersPage() {
    const { user, activeRole } = useAuth();
    const router = useRouter();
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


    const handleAcceptOrder = async (orderId: string) => {
        setIsUpdating(orderId);
        try {
            await updateOrderStatusAction({ orderId, status: 'En Préparation' });
            toast({
                title: "Commande acceptée !",
                description: "La commande est maintenant marquée comme étant en préparation.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de mettre à jour le statut. Vérifiez les permissions.",
            });
        } finally {
            setIsUpdating(null);
        }
    };
    
    const OrderCard = ({ order }: { order: Order }) => (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>{order.nomRestaurant}</span>
                    <Badge variant={order.statut === 'Placée' ? 'destructive' : 'default'}>{order.statut}</Badge>
                </CardTitle>
                <CardDescription>Commande n°{order.id.slice(0, 5)}... &bull; {new Date(order.date).toLocaleTimeString('fr-FR')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger>Voir les détails</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                            {order.plats.map(item => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.quantite}x {item.nom}</span>
                                    <span>{(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            ))}
                             <div className="border-t pt-2 mt-2 space-y-1">
                                <div className="flex justify-between">
                                    <span>Total</span>
                                    <span className="font-semibold">{order.total.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Commission ({order.tauxCommission * 100}%)</span>
                                    <span>- {order.montantCommission.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between font-bold text-primary">
                                    <span>Revenu Net</span>
                                    <span>{order.revenuNet.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                {order.statut === 'Placée' && (
                    <Button 
                        onClick={() => handleAcceptOrder(order.id)} 
                        disabled={isUpdating === order.id} 
                        className="w-full mt-4"
                    >
                        {isUpdating === order.id ? <Loader className="animate-spin" /> : <CheckCircle />}
                        Commencer la préparation
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Gestion des Commandes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <h2 className="text-2xl font-headline mb-4">Nouvelles Commandes ({newOrders.length})</h2>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {newOrders.length > 0 ? (
                             newOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <p className="text-muted-foreground p-4 bg-card rounded-lg">Aucune nouvelle commande pour le moment.</p>
                        )}
                    </div>
                </div>
                 <div>
                    <h2 className="text-2xl font-headline mb-4">En Préparation ({preparingOrders.length})</h2>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {preparingOrders.length > 0 ? (
                             preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <p className="text-muted-foreground p-4 bg-card rounded-lg">Aucune commande en préparation.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
