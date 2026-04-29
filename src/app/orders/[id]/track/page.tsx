

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { Order, UserProfile, Restaurant } from '@/lib/types';
import { Loader, MapPin, Bike, Home, CalendarClock, CreditCard, AlertTriangle, XCircle } from 'lucide-react';
import { formatScheduledDate } from '@/lib/scheduled-orders';
import { getPaymentMethod } from '@/lib/payment';
import { Badge } from '@/components/ui/badge';
import { ReportIncidentDialog } from '@/components/report-incident-dialog';
import { IncidentList } from '@/components/incident-list';
import { CancelOrderDialog } from '@/components/cancel-order-dialog';
import { OrderChat } from '@/components/order-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeliveryMap } from '@/components/delivery-map-loader';

export default function TrackOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { getOrder, getRestaurant } = useData();
    const { db } = useFirebase();

    const orderId = params.id as string;
    
    // We get the order from the store but also subscribe to real-time updates for its status
    const [liveOrder, setLiveOrder] = React.useState<Order | null>(getOrder(orderId) || null);
    const [livreur, setLivreur] = React.useState<UserProfile | null>(null);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);

    React.useEffect(() => {
      const orderDocRef = doc(db, 'commandes', orderId);
      const unsubscribeOrder = onSnapshot(orderDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
           // Security check
          if (user && orderData.userId !== user.uid) {
            router.push('/');
            return;
          }
          setLiveOrder(orderData);

          // Once we have the order, fetch related data
          if (orderData.restaurantId) {
            setRestaurant(getRestaurant(orderData.restaurantId) || null);
          }
          
          if (orderData.livreurId) {
              const livreurDocRef = doc(db, 'utilisateurs', orderData.livreurId);
              const unsubscribeLivreur = onSnapshot(livreurDocRef, (livreurSnap) => {
                  if (livreurSnap.exists()) {
                      setLivreur(livreurSnap.data() as UserProfile);
                  }
              });
              return () => unsubscribeLivreur(); // Clean up livreur listener
          } else {
              setLivreur(null);
          }
        } else {
            router.push('/');
        }
      });
      return () => unsubscribeOrder();
    }, [orderId, user, router, getRestaurant, db]);

    if (!liveOrder) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Chargement de la commande...</p>
            </div>
        );
    }
    
    const mapPoints = {
        restaurant: restaurant?.latitude && restaurant?.longitude
            ? { latitude: restaurant.latitude, longitude: restaurant.longitude, name: restaurant.nom }
            : undefined,
        client: liveOrder.latitudeClient && liveOrder.longitudeClient
            ? { latitude: liveOrder.latitudeClient, longitude: liveOrder.longitudeClient, name: 'Votre adresse' }
            : undefined,
        livreur: livreur?.latitude && livreur?.longitude
            ? { latitude: livreur.latitude, longitude: livreur.longitude, name: livreur.nom || 'Livreur' }
            : undefined,
    };
    const hasAnyPoint = mapPoints.restaurant || mapPoints.client || mapPoints.livreur;

    return (
        <div className="container mx-auto">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/">
                    &larr; Retour à l'accueil
                </Link>
            </Button>
             <Card>
                <CardHeader>
                    <CardTitle>Suivi de votre commande n°{liveOrder.id.slice(0, 6)}...</CardTitle>
                    {liveOrder.programmePour && (
                        <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-2 text-sm text-blue-700 dark:text-blue-300">
                            <CalendarClock className="h-4 w-4" />
                            <span>Programmée pour <strong>{formatScheduledDate(liveOrder.programmePour)}</strong></span>
                        </div>
                    )}
                    {liveOrder.methodePaiement && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {getPaymentMethod(liveOrder.methodePaiement).shortLabel}
                            </Badge>
                            {liveOrder.statutPaiement && (
                                <Badge
                                    variant={
                                        liveOrder.statutPaiement === 'Confirmé'
                                            ? 'default'
                                            : liveOrder.statutPaiement === 'Échoué'
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                    className={liveOrder.statutPaiement === 'Confirmé' ? 'bg-green-600' : ''}
                                >
                                    {liveOrder.statutPaiement}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 relative h-96 md:h-full min-h-[400px] rounded-lg overflow-hidden bg-muted">
                        {hasAnyPoint ? (
                            <DeliveryMap
                                restaurant={mapPoints.restaurant}
                                client={mapPoints.client}
                                livreur={mapPoints.livreur}
                                className="h-full w-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>La carte de suivi est indisponible.</p>
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <div className="flex items-start gap-4">
                            <MapPin className="h-8 w-8 text-red-500 mt-1" />
                            <div>
                                <p className="font-bold">Restaurant</p>
                                <p className="text-muted-foreground">{restaurant?.nom}</p>
                                <p className="text-sm text-muted-foreground">{restaurant?.adresse}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Bike className="h-8 w-8 text-primary mt-1" />
                            <div>
                                <p className="font-bold">Livreur</p>
                                <p className="text-muted-foreground">{livreur?.nom || "En attente d'assignation..."}</p>
                                {livreur?.latitude ? (
                                    <p className="text-sm text-primary animate-pulse">En mouvement...</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">En attente de localisation...</p>
                                )}
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <Home className="h-8 w-8 text-green-600 mt-1" />
                            <div>
                                <p className="font-bold">Votre Adresse</p>
                                <p className="text-muted-foreground">{liveOrder.adresseClient}</p>
                            </div>
                        </div>

                        {liveOrder.incidents && liveOrder.incidents.length > 0 && (
                            <IncidentList incidents={liveOrder.incidents} />
                        )}

                        {liveOrder.livreurId && liveOrder.statut !== 'Annulée' && (
                            <OrderChat
                                orderId={liveOrder.id}
                                myRole="client"
                                active={liveOrder.statut !== 'Livrée'}
                            />
                        )}

                        <div className="space-y-2 pt-2 border-t">
                            {liveOrder.statut === 'Placée' && (
                                <CancelOrderDialog orderId={liveOrder.id} canCancel>
                                    <Button variant="destructive" className="w-full">
                                        <XCircle className="h-4 w-4" />
                                        Annuler la commande
                                    </Button>
                                </CancelOrderDialog>
                            )}
                            {liveOrder.statut !== 'Annulée' && liveOrder.statut !== 'Livrée' && (
                                <ReportIncidentDialog orderId={liveOrder.id} reporter="client">
                                    <Button variant="outline" className="w-full">
                                        <AlertTriangle className="h-4 w-4" />
                                        Signaler un problème
                                    </Button>
                                </ReportIncidentDialog>
                            )}
                            {liveOrder.statut === 'Annulée' && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                    <p className="font-semibold">Commande annulée</p>
                                    {liveOrder.motifAnnulation && (
                                        <p className="text-xs mt-1">{liveOrder.motifAnnulation}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

