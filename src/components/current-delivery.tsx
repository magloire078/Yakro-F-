'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Home, Map, Phone, Loader } from 'lucide-react';
import Link from 'next/link';
import { canTransitionOrder } from '@/lib/order-transitions';

interface CurrentDeliveryProps {
    order: Order;
    onCompleteDelivery: () => Promise<void>;
}

export function CurrentDelivery({ order, onCompleteDelivery }: CurrentDeliveryProps) {
    const [isCompleting, setIsCompleting] = React.useState(false);

    const getGoogleMapsLink = (order: Order) => {
        if (!order.latitudeRestaurant || !order.longitudeRestaurant || !order.latitudeClient || !order.longitudeClient) {
            return null;
        }
        return `https://www.google.com/maps/dir/?api=1&origin=${order.latitudeRestaurant},${order.longitudeRestaurant}&destination=${order.latitudeClient},${order.longitudeClient}&travelmode=driving`;
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        await onCompleteDelivery();
        setIsCompleting(false);
    };

    const mapsLink = getGoogleMapsLink(order);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Livraison en cours</h1>
            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                       <span>Commande n°{order.id.slice(0, 5)}...</span>
                       <Badge variant="default">En cours</Badge>
                    </CardTitle>
                    <CardDescription>Récupérez et livrez la commande suivante.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-start gap-4">
                            <ChefHat className="text-primary mt-1"/>
                            <div>
                                <p className="font-semibold text-lg">1. Récupérer chez {order.nomRestaurant}</p>
                                <p className="text-muted-foreground">{order.adresseRestaurant}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <Home className="text-green-500 mt-1"/>
                            <div>
                                <p className="font-semibold text-lg">2. Livrer à</p>
                                <p className="text-muted-foreground">{order.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {mapsLink && (
                            <Button asChild variant="outline" className="w-full">
                                <Link href={mapsLink} target="_blank" rel="noopener noreferrer">
                                    <Map className="mr-2"/>
                                    Voir sur la carte
                                </Link>
                            </Button>
                        )}
                         <div className="flex items-center gap-4">
                            <p>Contenu : {order.plats.map(i => `${i.quantite}x ${i.nom}`).join(', ')}</p>
                        </div>
                         <div className="flex items-center gap-4">
                            <Phone className="text-muted-foreground"/>
                            <p>Client : {order.telephoneClient}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleComplete}
                            disabled={isCompleting || !canTransitionOrder(order.statut, 'Livrée', 'livreur')}
                        >
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
