'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Home, Map, Phone, Loader, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { DeliveryMap } from '@/components/delivery-map-loader';
import { useAuth } from '@/contexts/auth-context';
import { useLivreurPosition } from '@/hooks/use-livreur-position';
import { ReportIncidentDialog } from '@/components/report-incident-dialog';
import { IncidentList } from '@/components/incident-list';
import { OrderChat } from '@/components/order-chat';

interface CurrentDeliveryProps {
    order: Order;
    onCompleteDelivery: () => Promise<void>;
}

export function CurrentDelivery({ order, onCompleteDelivery }: CurrentDeliveryProps) {
    const { user, userProfile } = useAuth();
    const [isCompleting, setIsCompleting] = React.useState(false);

    useLivreurPosition({ enabled: order.statut === 'En Route', uid: user?.uid });

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

    const mapPoints = {
        restaurant: order.latitudeRestaurant && order.longitudeRestaurant
            ? { latitude: order.latitudeRestaurant, longitude: order.longitudeRestaurant, name: order.nomRestaurant }
            : undefined,
        client: order.latitudeClient && order.longitudeClient
            ? { latitude: order.latitudeClient, longitude: order.longitudeClient, name: 'Adresse client' }
            : undefined,
        livreur: userProfile?.latitude && userProfile?.longitude
            ? { latitude: userProfile.latitude, longitude: userProfile.longitude, name: 'Vous' }
            : undefined,
    };
    const hasMap = mapPoints.restaurant || mapPoints.client || mapPoints.livreur;

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
                    {hasMap && (
                        <div className="h-72 rounded-lg overflow-hidden border">
                            <DeliveryMap
                                restaurant={mapPoints.restaurant}
                                client={mapPoints.client}
                                livreur={mapPoints.livreur}
                                className="h-full w-full"
                            />
                        </div>
                    )}
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
                                <p className="font-semibold text-lg">2. Livrer à {order.libelleAdresse ? `(${order.libelleAdresse})` : ''}</p>
                                <p className="text-muted-foreground">{order.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                    {order.instructionsLivraison && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4 flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-200">Instructions du client</p>
                                <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-line">{order.instructionsLivraison}</p>
                            </div>
                        </div>
                    )}
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
                    {order.incidents && order.incidents.length > 0 && (
                        <IncidentList incidents={order.incidents} />
                    )}
                    <OrderChat orderId={order.id} myRole="livreur" />
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                        <Button className="w-full" size="lg" onClick={handleComplete} disabled={isCompleting}>
                            {isCompleting && <Loader className="animate-spin mr-2" />}
                            Marquer comme livré
                        </Button>
                        <ReportIncidentDialog orderId={order.id} reporter="livreur">
                            <Button variant="outline" className="w-full" size="lg">
                                <AlertTriangle className="h-4 w-4" />
                                Signaler un problème
                            </Button>
                        </ReportIncidentDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
