
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { MapMarker, MapRoute, Order, Restaurant } from '@/lib/types';
import { Loader, MapPin, Bike, Home, Wallet, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LiveMap } from '@/components/map/live-map';
import { hasCoords, orderClientPoint, orderRestaurantPoint, useClientPositionSharing, useLivreurPositions } from '@/hooks/use-live-locations';
import Link from 'next/link';
import { initiateMobileMoneyPaymentAction } from '@/app/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { getOrder, getRestaurant } = useData();
    const { db } = useFirebase();
    const { toast } = useToast();

    const orderId = searchParams.get('id');

    const [liveOrder, setLiveOrder] = React.useState<Order | null>(null);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
    const [isRetryingPayment, setIsRetryingPayment] = React.useState(false);
    const [shareLocation, setShareLocation] = React.useState(false);

    // Position du livreur assigné, suivie dans son propre écouteur (l'ancien
    // écouteur, créé dans le callback de la commande, n'était jamais
    // désabonné et se multipliait à chaque mise à jour de la commande).
    const livreurPositions = useLivreurPositions([liveOrder?.livreurId]);
    const livreur = liveOrder?.livreurId ? livreurPositions[liveOrder.livreurId] ?? null : null;

    const isOrderActive = !!liveOrder && !['Livrée', 'Annulée'].includes(liveOrder.statut);
    const sharing = useClientPositionSharing({
        orderId,
        userId: user?.uid ?? null,
        enabled: shareLocation && isOrderActive,
    });

    // Le partage s'arrête de lui-même quand la commande est terminée.
    React.useEffect(() => {
        if (!isOrderActive) setShareLocation(false);
    }, [isOrderActive]);

    React.useEffect(() => {
        if (sharing.status === 'denied') {
            setShareLocation(false);
            toast({ variant: 'destructive', title: 'Position refusée', description: 'Autorisez la localisation dans votre navigateur pour la partager avec le livreur.' });
        } else if (sharing.status === 'unsupported') {
            setShareLocation(false);
            toast({ variant: 'destructive', title: 'Localisation indisponible', description: "Votre appareil ne permet pas de partager votre position." });
        }
    }, [sharing.status, toast]);

    const handleRetryPayment = async () => {
        if (!orderId || !user) return;
        setIsRetryingPayment(true);
        try {
            const idToken = await user.getIdToken();
            const result = await initiateMobileMoneyPaymentAction(orderId, idToken);
            if (!result.success) {
                toast({ variant: 'destructive', title: 'Erreur', description: result.error });
                return;
            }
            window.location.href = result.paymentUrl;
        } catch (error) {
            console.error('handleRetryPayment: échec', error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de relancer le paiement pour le moment.' });
        } finally {
            setIsRetryingPayment(false);
        }
    };

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

    const restaurantPoint = hasCoords(restaurant)
        ? restaurant
        : orderRestaurantPoint(liveOrder);
    const clientPoint = sharing.position
        ?? orderClientPoint(liveOrder);

    const mapMarkers: MapMarker[] = [];
    if (restaurantPoint) {
        mapMarkers.push({ id: 'restaurant', kind: 'restaurant', ...restaurantPoint, label: restaurant?.nom || liveOrder.nomRestaurant, sublabel: restaurant?.adresse || liveOrder.adresseRestaurant });
    }
    if (hasCoords(livreur)) {
        mapMarkers.push({ id: 'livreur', kind: 'livreur', latitude: livreur.latitude, longitude: livreur.longitude, label: livreur.nom || 'Votre livreur', live: true });
    }
    if (clientPoint) {
        mapMarkers.push({ id: 'client', kind: 'client', ...clientPoint, label: sharing.position ? 'Vous (position en direct)' : 'Adresse de livraison', sublabel: liveOrder.adresseClient, live: !!sharing.position });
    }

    const mapRoutes: MapRoute[] = [];
    if (restaurantPoint && clientPoint) {
        const points: Array<[number, number]> = [[restaurantPoint.latitude, restaurantPoint.longitude]];
        if (hasCoords(livreur) && liveOrder.statut === 'En Route') points.push([livreur.latitude, livreur.longitude]);
        points.push([clientPoint.latitude, clientPoint.longitude]);
        mapRoutes.push({ id: 'trajet', points, status: liveOrder.statut === 'En Route' ? 'active' : 'planned' });
    }

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Button asChild variant="ghost" className="mb-4 sm:mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-orange-500 h-8 px-2">
                <Link href="/">
                    ← Retour à l&apos;accueil
                </Link>
            </Button>

            <div className="space-y-2 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-3.5 sm:h-4 w-1.5 flex-col rounded-full overflow-hidden shrink-0 shadow-xs">
                        <div className="flex-1 bg-orange-500" />
                        <div className="flex-1 bg-white dark:bg-slate-300" />
                        <div className="flex-1 bg-emerald-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Suivi en direct</p>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black italic uppercase tracking-tighter text-foreground leading-none">
                    Commande <span className="text-orange-500">#{liveOrder.id.slice(0, 6)}</span>
                </h1>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
                <div className="md:col-span-2 space-y-3">
                    <div className="relative h-72 sm:h-96 md:h-[480px] rounded-xl sm:rounded-2xl overflow-hidden bg-muted/40 border border-border/50">
                        {mapMarkers.length > 0 ? (
                            <LiveMap markers={mapMarkers} routes={mapRoutes} className="h-full w-full" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                <MapPin className="h-8 w-8 opacity-40" />
                                <p className="text-[11px] font-black uppercase tracking-widest">Carte indisponible</p>
                            </div>
                        )}
                    </div>

                    {isOrderActive && (
                        <label className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-background/40 border border-border/30 cursor-pointer">
                            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                                <Navigation className="h-4 w-4 text-sky-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">Partager ma position en direct</p>
                                <p className="text-xs text-muted-foreground">
                                    {shareLocation
                                        ? sharing.status === 'active'
                                            ? sharing.writeError ? 'Envoi impossible pour le moment, nouvel essai en cours…' : 'Le livreur et le restaurant voient votre position jusqu’à la livraison.'
                                            : 'Localisation en cours…'
                                        : 'Aide le livreur à vous trouver. Arrêt automatique à la livraison.'}
                                </p>
                            </div>
                            <Switch checked={shareLocation} onCheckedChange={setShareLocation} aria-label="Partager ma position en direct" />
                        </label>
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
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paiement</p>
                            <p className="font-bold text-foreground">
                                {liveOrder.paiement.mode === 'especes'
                                    ? 'Espèces à la livraison'
                                    : `Mobile Money — ${
                                        liveOrder.paiement.statut === 'paye' ? 'confirmé'
                                        : liveOrder.paiement.statut === 'echoue' ? 'échoué'
                                        : 'en attente de confirmation'
                                      }`}
                            </p>
                            {liveOrder.paiement.mode !== 'especes' && liveOrder.paiement.statut !== 'paye' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={handleRetryPayment}
                                    disabled={isRetryingPayment}
                                >
                                    {isRetryingPayment ? <Loader className="h-4 w-4 animate-spin" /> : 'Réessayer le paiement'}
                                </Button>
                            )}
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
