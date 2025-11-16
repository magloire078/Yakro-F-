

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, UserProfile, Restaurant } from '@/lib/types';
import { Loader, MapPin, Bike, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TrackOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { getOrder, getRestaurant } = useData();

    const orderId = params.id as string;
    const order = getOrder ? getOrder(orderId) : undefined; // The hook might not be loaded yet
    
    const [livreur, setLivreur] = React.useState<UserProfile | null>(null);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!order || !order.livreurId) {
            if (!authLoading && order) { // If order exists but no livreurId
                router.push('/'); // Redirect if there's no delivery to track
            }
            return;
        };

        setRestaurant(getRestaurant(order.restaurantId) || null);
        
        const livreurDocRef = doc(db, 'utilisateurs', order.livreurId);
        const unsubscribe = onSnapshot(livreurDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setLivreur(docSnap.data() as UserProfile);
            }
            setLoading(false);
        });

        return () => unsubscribe();

    }, [order, getRestaurant, authLoading, router]);

    if (loading || authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader className="animate-spin h-16 w-16 text-primary" /></div>;
    }

    if (!order || !user || order.userId !== user.uid) {
        return (
            <div className="container mx-auto text-center py-10">
                <p>Commande non trouvée ou accès non autorisé.</p>
                <Button asChild className="mt-4"><Link href="/">Retour à l'accueil</Link></Button>
            </div>
        );
    }
    
    // Static map image URL
    const getMapUrl = () => {
        if (!restaurant?.latitude || !restaurant?.longitude || !livreur?.latitude || !livreur?.longitude) {
            // Return a default map if some coordinates are missing
            return 'https://picsum.photos/seed/map/1200/800';
        }
        
        // Simple static map representation - NOT A REAL MAP API
        // For a real app, use Google Maps Static API or a library like react-map-gl
        // This is a placeholder to demonstrate the concept
        const path = `path=color:0x0000ff|weight:5|${restaurant.latitude},${restaurant.longitude}|${livreur.latitude},${livreur.longitude}`;
        const markers = `markers=color:red|label:R|${restaurant.latitude},${restaurant.longitude}&markers=color:green|label:L|${livreur.latitude},${livreur.longitude}`;

        return `https://maps.googleapis.com/maps/api/staticmap?size=1200x800&${path}&${markers}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
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
                    <CardTitle>Suivi de votre commande n°{order.id.slice(0, 6)}...</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 relative h-96 md:h-full min-h-[400px] rounded-lg overflow-hidden bg-muted">
                        <Image 
                            src={getMapUrl()}
                            alt="Carte de suivi"
                            layout="fill"
                            objectFit="cover"
                        />
                         {livreur?.latitude && livreur?.longitude && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Bike className="h-10 w-10 text-primary animate-bounce" />
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
                                <p className="text-muted-foreground">{livreur?.nom}</p>
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
                                <p className="text-muted-foreground">{order.adresseClient}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
