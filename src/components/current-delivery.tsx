'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Home, Phone, Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { MapPoint } from '@/components/leaflet-map';

const LeafletMap = dynamic(
    () => import('@/components/leaflet-map').then(m => m.LeafletMap),
    { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Chargement de la carte...</div> }
);

interface CurrentDeliveryProps {
    order: Order;
    onCompleteDelivery: () => Promise<void>;
}

export function CurrentDelivery({ order, onCompleteDelivery }: CurrentDeliveryProps) {
    const [isCompleting, setIsCompleting] = React.useState(false);

    const handleComplete = async () => {
        setIsCompleting(true);
        await onCompleteDelivery();
        setIsCompleting(false);
    };

    const mapPoints: MapPoint[] = [];
    if (order.latitudeRestaurant && order.longitudeRestaurant) {
        mapPoints.push({ lat: order.latitudeRestaurant, lng: order.longitudeRestaurant, label: `Récupérer : ${order.nomRestaurant}`, color: 'red' });
    }
    if (order.latitudeClient && order.longitudeClient) {
        mapPoints.push({ lat: order.latitudeClient, lng: order.longitudeClient, label: `Livrer : ${order.adresseClient}`, color: 'green' });
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl md:text-4xl font-display text-primary mb-6 md:mb-8">Livraison en cours</h1>
            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                       <span>Commande n°{order.id.slice(0, 5)}...</span>
                       <Badge variant="default">En cours</Badge>
                    </CardTitle>
                    <CardDescription>Récupérez et livrez la commande suivante.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Carte intégrée */}
                    {mapPoints.length > 0 && (
                        <div className="h-56 sm:h-64 rounded-lg overflow-hidden border">
                            <LeafletMap points={mapPoints} className="h-full w-full" />
                        </div>
                    )}

                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-start gap-4">
                            <ChefHat className="text-primary mt-1 shrink-0"/>
                            <div>
                                <p className="font-semibold text-lg">1. Récupérer chez {order.nomRestaurant}</p>
                                <p className="text-muted-foreground">{order.adresseRestaurant}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Home className="text-green-500 mt-1 shrink-0"/>
                            <div>
                                <p className="font-semibold text-lg">2. Livrer à</p>
                                <p className="text-muted-foreground">{order.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <p>Contenu : {order.plats.map(i => `${i.quantite}x ${i.nom}`).join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Phone className="text-muted-foreground shrink-0"/>
                            <p>Client : {order.telephoneClient}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                        <Button className="w-full" size="lg" onClick={handleComplete} disabled={isCompleting}>
                            {isCompleting && <Loader className="animate-spin mr-2" />}
                            Marquer comme livré
                        </Button>
                        <Button variant="outline" className="w-full" size="lg">Signaler un problème</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
