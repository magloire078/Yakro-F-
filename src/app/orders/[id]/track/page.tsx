'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { Order, UserProfile, Restaurant } from '@/lib/types';
import { MapPin, Bike, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { MapPoint } from '@/components/leaflet-map';

const LeafletMap = dynamic(
  () => import('@/components/leaflet-map').then(m => m.LeafletMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Chargement de la carte...</div> }
);

export default function TrackOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { getOrder, getRestaurant } = useData();
    const { db } = useFirebase();

    const orderId = params.id as string;

    const [liveOrder, setLiveOrder] = React.useState<Order | null>(getOrder(orderId) || null);
    const [livreur, setLivreur] = React.useState<UserProfile | null>(null);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);

    React.useEffect(() => {
      const orderDocRef = doc(db, 'commandes', orderId);
      const unsubscribeOrder = onSnapshot(orderDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
          if (user && orderData.userId !== user.uid) {
            router.push('/');
            return;
          }
          setLiveOrder(orderData);

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
              return () => unsubscribeLivreur();
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

    const mapPoints: MapPoint[] = [];
    if (restaurant?.latitude && restaurant?.longitude) {
        mapPoints.push({ lat: restaurant.latitude, lng: restaurant.longitude, label: `Restaurant : ${restaurant.nom}`, color: 'red' });
    }
    if (livreur?.latitude && livreur?.longitude) {
        mapPoints.push({ lat: livreur.latitude, lng: livreur.longitude, label: `Livreur : ${livreur.nom || 'En route'}`, color: 'blue' });
    }
    if (liveOrder.latitudeClient && liveOrder.longitudeClient) {
        mapPoints.push({ lat: liveOrder.latitudeClient, lng: liveOrder.longitudeClient, label: `Votre adresse : ${liveOrder.adresseClient}`, color: 'green' });
    }

    return (
        <div className="container mx-auto">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/">
                    &larr; Retour à l'accueil
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Suivi de votre commande n°{liveOrder.id.slice(0, 6)}...</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 p-4 md:p-6">
                    <div className="md:col-span-2 relative h-72 sm:h-80 md:h-full md:min-h-[400px] rounded-lg overflow-hidden bg-muted">
                        {mapPoints.length > 0 ? (
                            <LeafletMap points={mapPoints} className="h-full w-full rounded-lg" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                                <p>La carte de suivi est indisponible (coordonnées manquantes).</p>
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-1 space-y-4 md:space-y-6">
                        <div className="flex items-start gap-3 md:gap-4">
                            <MapPin className="h-6 w-6 md:h-8 md:w-8 text-red-500 mt-1 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold">Restaurant</p>
                                <p className="text-sm md:text-base text-muted-foreground truncate">{restaurant?.nom}</p>
                                <p className="text-xs md:text-sm text-muted-foreground break-words">{restaurant?.adresse}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 md:gap-4">
                            <Bike className="h-6 w-6 md:h-8 md:w-8 text-primary mt-1 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold">Livreur</p>
                                <p className="text-sm md:text-base text-muted-foreground truncate">{livreur?.nom || "En attente d'assignation..."}</p>
                                {livreur?.latitude ? (
                                    <p className="text-xs md:text-sm text-primary animate-pulse">En mouvement...</p>
                                ) : (
                                    <p className="text-xs md:text-sm text-muted-foreground">En attente de localisation...</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3 md:gap-4">
                            <Home className="h-6 w-6 md:h-8 md:w-8 text-green-600 mt-1 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold">Votre Adresse</p>
                                <p className="text-sm md:text-base text-muted-foreground break-words">{liveOrder.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
