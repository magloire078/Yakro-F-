'use client';

import * as React from 'react';
import type { MapMarker, MapRoute, Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Home, Map, Phone, Loader } from 'lucide-react';
import Link from 'next/link';
import { canTransitionOrder } from '@/lib/order-transitions';
import { distanceMeters, estimateArrivalMinutes, formatDistance } from '@/lib/delivery-eta';
import { LiveMap } from '@/components/map/live-map';
import { orderClientPoint, orderRestaurantPoint, useClientPositions, useWatchPosition } from '@/hooks/use-live-locations';

interface CurrentDeliveryProps {
    order: Order;
    onCompleteDelivery: () => Promise<void>;
}

export function CurrentDelivery({ order, onCompleteDelivery }: CurrentDeliveryProps) {
    const [isCompleting, setIsCompleting] = React.useState(false);
    const { position: myPosition } = useWatchPosition(true);
    const clientPositions = useClientPositions([order.id]);
    const clientLive = clientPositions[order.id];

    const restaurantPoint = orderRestaurantPoint(order);
    // Position live du client si elle est partagée, sinon son adresse de livraison.
    const clientPoint = clientLive
        ? { latitude: clientLive.latitude, longitude: clientLive.longitude }
        : orderClientPoint(order);

    const distanceToClient = myPosition && clientPoint ? distanceMeters(myPosition, clientPoint) : null;

    const mapMarkers: MapMarker[] = [];
    if (myPosition) mapMarkers.push({ id: 'moi', kind: 'livreur', ...myPosition, label: 'Vous', live: true });
    if (restaurantPoint) mapMarkers.push({ id: 'restaurant', kind: 'restaurant', ...restaurantPoint, label: order.nomRestaurant, sublabel: order.adresseRestaurant });
    if (clientPoint) mapMarkers.push({ id: 'client', kind: 'client', ...clientPoint, label: clientLive ? 'Client (position en direct)' : 'Adresse du client', sublabel: order.adresseClient, live: !!clientLive });

    const routePoints: Array<[number, number]> = [myPosition, restaurantPoint, clientPoint]
        .filter((point): point is { latitude: number; longitude: number } => !!point)
        .map((point) => [point.latitude, point.longitude]);
    const mapRoutes: MapRoute[] = routePoints.length >= 2 ? [{ id: 'course', points: routePoints, status: 'active' }] : [];

    const getGoogleMapsLink = () => {
        if (!restaurantPoint || !clientPoint) return null;
        return `https://www.google.com/maps/dir/?api=1&origin=${restaurantPoint.latitude},${restaurantPoint.longitude}&destination=${clientPoint.latitude},${clientPoint.longitude}&travelmode=driving`;
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        await onCompleteDelivery();
        setIsCompleting(false);
    };

    const mapsLink = getGoogleMapsLink();

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
                    {mapMarkers.length > 0 && (
                        <div className="space-y-2">
                            <div className="h-64 sm:h-80 rounded-xl overflow-hidden border border-border">
                                <LiveMap markers={mapMarkers} routes={mapRoutes} className="h-full w-full" />
                            </div>
                            {distanceToClient !== null && (
                                <p className="text-xs sm:text-sm font-bold text-foreground">
                                    Client à {formatDistance(distanceToClient)} · ~{estimateArrivalMinutes(distanceToClient)} min
                                    {clientLive && <span className="ml-1.5 text-sky-500">(position en direct)</span>}
                                </p>
                            )}
                        </div>
                    )}
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
                                    Itinéraire dans Google Maps
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
