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
        <div className="container mx-auto px-1 sm:px-4 pb-16">
            <h1 className="text-2xl sm:text-4xl font-headline font-bold text-primary mb-4 sm:mb-8">Livraison en cours</h1>
            <Card className="bg-primary/5 rounded-2xl border border-primary/20 shadow-xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <CardTitle className="flex justify-between items-center text-lg sm:text-xl">
                       <span>Commande n°{order.id.slice(0, 5)}...</span>
                       <Badge variant="default">En cours</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Récupérez et livrez la commande suivante.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="space-y-3 border-b pb-3 sm:pb-4">
                        <div className="flex items-start gap-3">
                            <ChefHat className="text-primary mt-0.5 h-5 w-5 flex-shrink-0"/>
                            <div>
                                <p className="font-semibold text-base sm:text-lg leading-tight">1. Récupérer chez {order.nomRestaurant}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{order.adresseRestaurant}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Home className="text-green-500 mt-0.5 h-5 w-5 flex-shrink-0"/>
                            <div>
                                <p className="font-semibold text-base sm:text-lg leading-tight">2. Livrer à</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{order.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2.5 sm:space-y-3">
                        {mapsLink && (
                            <Button asChild variant="outline" className="w-full h-10 text-xs sm:text-sm font-bold rounded-xl">
                                <Link href={mapsLink} target="_blank" rel="noopener noreferrer">
                                    <Map className="mr-2 h-4 w-4"/>
                                    Voir sur la carte
                                </Link>
                            </Button>
                        )}
                         <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <p className="font-medium">Contenu : {order.plats.map(i => `${i.quantite}x ${i.nom}`).join(', ')}</p>
                        </div>
                         <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <Phone className="text-muted-foreground h-4 w-4 flex-shrink-0"/>
                            <p>Client : <span className="font-semibold">{order.telephoneClient}</span></p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t">
                        <Button
                            className="w-full h-11 text-sm font-bold rounded-xl"
                            onClick={handleComplete}
                            disabled={isCompleting || !canTransitionOrder(order.statut, 'Livrée', 'livreur')}
                        >
                            {isCompleting && <Loader className="animate-spin mr-2 h-4 w-4" />}
                            Marquer comme livré
                        </Button>
                        <Button variant="outline" className="w-full h-11 text-sm font-bold rounded-xl">Signaler un problème</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
