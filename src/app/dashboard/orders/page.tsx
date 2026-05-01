'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, CheckCircle, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QrCodeDialog } from '@/components/qr-code-dialog';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function DashboardOrdersPage() {
    const { user, activeRole } = useAuth();
    const { db } = useFirebase();
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
        const orderRef = doc(db, 'commandes', orderId);
        const updateData = { statut: 'En Préparation' };

        updateDoc(orderRef, updateData)
            .then(() => {
                toast({
                    title: "Commande acceptée !",
                    description: "La commande est maintenant en préparation.",
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsUpdating(null);
            });
    };
    
    const OrderCard = ({ order }: { order: Order }) => (
        <Card className="shadow-md transition-all hover:shadow-lg">
            <CardHeader className="p-4">
                <CardTitle className="flex justify-between items-center text-lg">
                    <span className="truncate">{order.nomRestaurant}</span>
                    <Badge variant={order.statut === 'Placée' ? 'destructive' : 'default'}>{order.statut}</Badge>
                </CardTitle>
                <CardDescription className="flex justify-between items-center text-xs">
                    <span>Commande n°{order.id.slice(0, 5)}...</span>
                    <span>{new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger className="py-2 text-sm">Voir les détails</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                            {order.plats.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{item.quantite}x {item.nom}</span>
                                    <span className="text-muted-foreground">{(item.prix * item.quantite).toLocaleString('fr-FR')} F</span>
                                </div>
                            ))}
                             <div className="border-t pt-2 mt-2 space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Client</span>
                                    <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between text-primary font-bold">
                                    <span>Votre Revenu Net</span>
                                    <span>{order.revenuNet.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="mt-4">
                    {order.statut === 'Placée' && (
                        <Button 
                            onClick={() => handleAcceptOrder(order.id)} 
                            disabled={isUpdating === order.id} 
                            className="w-full btn-mobile"
                        >
                            {isUpdating === order.id ? <Loader className="animate-spin" /> : <CheckCircle className="mr-2" />}
                            Préparer la commande
                        </Button>
                    )}
                    {order.statut === 'En Préparation' && (
                        <QrCodeDialog orderId={order.id}>
                            <Button variant="outline" className="w-full btn-mobile">
                               <QrCode className="mr-2"/>
                               Validation QR Code
                            </Button>
                        </QrCodeDialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto pb-20">
            <h1 className="text-2xl md:text-3xl font-display text-primary mb-6">Suivi des Commandes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <section>
                    <h2 className="text-xl font-headline mb-4 flex items-center gap-2">
                        Nouvelles <Badge variant="secondary">{newOrders.length}</Badge>
                    </h2>
                    <div className="space-y-4">
                        {newOrders.length > 0 ? (
                             newOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <div className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground border-2 border-dashed">
                                Aucune nouvelle commande.
                            </div>
                        )}
                    </div>
                </section>
                
                <section>
                    <h2 className="text-xl font-headline mb-4 flex items-center gap-2">
                        En cuisine <Badge variant="secondary">{preparingOrders.length}</Badge>
                    </h2>
                    <div className="space-y-4">
                        {preparingOrders.length > 0 ? (
                             preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <div className="text-center py-8 bg-muted/30 rounded-lg text-muted-foreground border-2 border-dashed">
                                Rien en cours de préparation.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
