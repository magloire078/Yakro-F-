
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, Package, Clock, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DashboardOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { orders, isLoading, updateOrderStatus } = useData();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const activeOrders = React.useMemo(() => {
        return orders
            .filter(o => o.status === 'Placée' || o.status === 'En Préparation')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orders]);
    
    const newOrders = activeOrders.filter(o => o.status === 'Placée');
    const preparingOrders = activeOrders.filter(o => o.status === 'En Préparation');

    const handleAcceptOrder = async (orderId: string) => {
        setIsUpdating(orderId);
        try {
            await updateOrderStatus(orderId, 'En Préparation');
            toast({
                title: "Commande acceptée !",
                description: "La commande est maintenant marquée comme étant en préparation.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de mettre à jour le statut de la commande.",
            });
        } finally {
            setIsUpdating(null);
        }
    };
    
    const OrderCard = ({ order }: { order: Order }) => (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>{order.restaurantName}</span>
                    <Badge variant={order.status === 'Placée' ? 'destructive' : 'default'}>{order.status}</Badge>
                </CardTitle>
                <CardDescription>Commande n°{order.id.slice(0, 5)}... &bull; {new Date(order.date).toLocaleTimeString('fr-FR')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger>Voir les détails</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            ))}
                            <div className="font-bold border-t pt-2 mt-2 flex justify-between">
                                <span>Total</span>
                                <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                {order.status === 'Placée' && (
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

    if (authLoading || isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

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
