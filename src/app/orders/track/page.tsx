
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { Order, Restaurant } from '@/lib/types';
import type { LivreurPublicData } from '@/lib/livreur-public';
import { Loader, MapPin, Bike, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { getOrder, getRestaurant } = useData();
    const { db } = useFirebase();

    const orderId = searchParams.get('id');

    const [liveOrder, setLiveOrder] = React.useState<Order | null>(null);
    const [livreur, setLivreur] = React.useState<LivreurPublicData | null>(null);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);

    React.useEffect(() => {
        if (!orderId || !db) return;

        // Initialize with data from context if available
        const initialOrder = getOrder(orderId);
        if (initialOrder) setLiveOrder(initialOrder);

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
                    const livreurDocRef = doc(db, 'livreurs_public', orderData.livreurId);
                    const unsubscribeLivreur = onSnapshot(livreurDocRef, (livreurSnap) => {
                        if (livreurSnap.exists()) {
                            setLivreur(livreurSnap.data() as LivreurPublicData);
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
    }, [orderId, user, router, getRestaurant, db, getOrder]);

    if (!orderId) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <p>Identifiant de commande manquant.</p>
                <Button asChild>
                    <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
            </div>
        );
    }

    if (!liveOrder) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p>Chargement de la commande...</p>
                </div>
            </div>
        );
    }

    const getMapUrl = () => {
        if (!restaurant?.latitude || !restaurant?.longitude || !liveOrder.latitudeClient || !liveOrder.longitudeClient) {
            if (restaurant?.latitude && restaurant?.longitude) {
                return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${restaurant.latitude},${restaurant.longitude}`;
            }
            return null;
        }

        let url = `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${restaurant.latitude},${restaurant.longitude}&destination=${liveOrder.latitudeClient},${liveOrder.longitudeClient}`;

        if (livreur?.latitude && livreur?.longitude) {
            url += `&waypoints=${livreur.latitude},${livreur.longitude}`;
        }

        return url;
    }

    const mapUrl = getMapUrl();

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Button asChild variant="ghost" className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-orange-500">
                <Link href="/">
                    ← Retour à l&apos;accueil
                </Link>
            </Button>

            <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/70">Suivi en direct</p>
                <h1 className="text-3xl md:text-4xl font-headline font-black italic uppercase tracking-tighter text-foreground leading-none">
                    Commande <span className="text-orange-500">#{liveOrder.id.slice(0, 6)}</span>
                </h1>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 relative h-96 md:h-[500px] rounded-2xl overflow-hidden bg-muted/40 border border-border/50">
                    {mapUrl ? (
                        <iframe
                            className="w-full h-full border-0"
                            title="Carte de suivi de la livraison de votre commande"
                            loading="lazy"
                            allowFullScreen
                            src={mapUrl}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <MapPin className="h-8 w-8 opacity-40" />
                            <p className="text-[11px] font-black uppercase tracking-widest">Carte indisponible</p>
                        </div>
                    )}
                </div>

                <div className="md:col-span-1 space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/40 border border-border/30">
                        <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <MapPin className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Restaurant</p>
                            <p className="font-bold text-foreground truncate">{restaurant?.nom}</p>
                            <p className="text-xs text-muted-foreground/80 truncate">{restaurant?.adresse}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/40 border border-border/30">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Bike className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Livreur</p>
                            <p className="font-bold text-foreground truncate">{livreur?.nom || "En attente d'assignation…"}</p>
                            {livreur?.latitude ? (
                                <p className="text-xs font-bold text-orange-500 animate-pulse">En mouvement…</p>
                            ) : (
                                <p className="text-xs text-muted-foreground/80">En attente de localisation…</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/40 border border-border/30">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Home className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Votre adresse</p>
                            <p className="font-bold text-foreground">{liveOrder.adresseClient}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>}>
            <TrackOrderContent />
        </React.Suspense>
    );
}
