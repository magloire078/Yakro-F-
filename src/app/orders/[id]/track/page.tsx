

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { Order, UserProfile, Restaurant } from '@/lib/types';
import { Loader, MapPin, Bike, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    
    // Interactive map URL
    const getMapUrl = () => {
        if (!restaurant?.latitude || !restaurant?.longitude || !liveOrder.latitudeClient || !liveOrder.longitudeClient) {
            // Can't show directions without both points, maybe show restaurant location?
            if (restaurant?.latitude && restaurant?.longitude) {
                 return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${restaurant.latitude},${restaurant.longitude}`;
            }
            return null; // No map if no coords
        }
        
        let url = `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${restaurant.latitude},${restaurant.longitude}&destination=${liveOrder.latitudeClient},${liveOrder.longitudeClient}`;

        // Add livreur as a waypoint if available
        if (livreur?.latitude && livreur?.longitude) {
            url += `&waypoints=${livreur.latitude},${livreur.longitude}`;
        }
        
        return url;
    }
    
    const mapUrl = getMapUrl();

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
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 relative h-96 md:h-full min-h-[400px] rounded-lg overflow-hidden bg-muted">
                        {mapUrl ? (
                           <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={mapUrl}>
                            </iframe>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

