'use client';

import * as React from 'react';
import type { MapMarker, MapRoute, Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Home, Phone, Loader, CheckCircle2, DollarSign, Crown, Navigation, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { canTransitionOrder } from '@/lib/order-transitions';
import { distanceMeters, estimateArrivalMinutes, formatDistance } from '@/lib/delivery-eta';
import { LiveMap } from '@/components/map/live-map';
import { orderClientPoint, orderRestaurantPoint, useClientPositions, useWatchPosition } from '@/hooks/use-live-locations';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CurrentDeliveryProps {
    order: Order;
    onCompleteDelivery: () => Promise<void>;
}

export function CurrentDelivery({ order, onCompleteDelivery }: CurrentDeliveryProps) {
    const [isCompleting, setIsCompleting] = React.useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
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
    const isEspeces = order.paiement?.mode === 'especes';

    return (
        <div className="container mx-auto px-2 sm:px-4 pb-16 space-y-4">
            {/* Header & Tricolor badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 h-3 mr-1">
                        <span className="w-1.5 h-full rounded-full bg-orange-500" />
                        <span className="w-1.5 h-full rounded-full bg-white/70" />
                        <span className="w-1.5 h-full rounded-full bg-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-headline font-black text-foreground">Mission Livraison</h1>
                        <p className="text-xs text-muted-foreground">Course active · Yakro Express</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {order.prioritaire && (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs font-black">
                            <Crown className="w-3.5 h-3.5 mr-1" /> Prioritaire VIP
                        </Badge>
                    )}
                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs">
                        En Route
                    </Badge>
                </div>
            </div>

            {/* Bannière Mode de Paiement critique terrain */}
            {isEspeces ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500">
                            <DollarSign className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs uppercase font-black text-amber-600 dark:text-amber-400 tracking-wider">
                                Espèces à encaisser
                            </p>
                            <p className="text-lg sm:text-xl font-headline font-black text-foreground">
                                {order.total.toLocaleString('fr-FR')} FCFA
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-2xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400">
                        À la livraison
                    </Badge>
                </div>
            ) : (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-500">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                                Déjà payé en ligne ({order.paiement?.mode ? order.paiement.mode.replace('_', ' ').toUpperCase() : 'MOBILE MONEY'})
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                                Ne rien réclamer au client
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-2xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Paiement validé
                    </Badge>
                </div>
            )}

            <Card className="backdrop-blur-xl bg-card/85 dark:bg-white/[0.04] border border-white/10 dark:border-white/5 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="p-3.5 sm:p-5 pb-2 border-b border-border/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg font-headline font-black">
                            Commande #{order.id.slice(0, 7)}
                        </CardTitle>
                        <span className="text-xs font-black text-primary">
                            Gain : +{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA
                        </span>
                    </div>
                    <CardDescription className="text-xs">
                        Récupérez les plats chez le restaurateur et remettez-les au client.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-3.5 sm:p-5 space-y-4">
                    {/* Live GPS Map */}
                    {mapMarkers.length > 0 && (
                        <div className="space-y-2">
                            <div className="h-52 sm:h-72 rounded-xl overflow-hidden border border-border shadow-inner relative">
                                <LiveMap markers={mapMarkers} routes={mapRoutes} className="h-full w-full" />
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold px-1">
                                {distanceToClient !== null ? (
                                    <span className="flex items-center gap-1.5 text-foreground">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                        Distance client : {formatDistance(distanceToClient)} · ~{estimateArrivalMinutes(distanceToClient)} min
                                        {clientLive && <span className="text-sky-500 text-2xs">(GPS direct)</span>}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">Calcul itinéraire en cours...</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Boutons Actions Rapides 1 Main */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {order.telephoneClient && (
                            <Button
                                asChild
                                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center"
                            >
                                <a href={`tel:${order.telephoneClient}`}>
                                    <Phone className="mr-2 h-4 w-4 animate-bounce" />
                                    Appeler le client ({order.telephoneClient})
                                </a>
                            </Button>
                        )}
                        {mapsLink && (
                            <Button
                                asChild
                                variant="outline"
                                className="h-12 border-primary/30 hover:bg-primary/10 text-foreground font-black text-xs sm:text-sm rounded-xl flex items-center justify-center"
                            >
                                <Link href={mapsLink} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="mr-2 h-4 w-4 text-primary" />
                                    Ouvrir Google Maps GPS
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Étapes du trajet */}
                    <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-white/[0.02] border border-border/40 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-500">
                                <ChefHat className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs uppercase font-black text-orange-500 tracking-wider">1. Récupération</p>
                                <p className="font-bold text-sm text-foreground truncate">{order.nomRestaurant}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{order.adresseRestaurant}</p>
                            </div>
                        </div>

                        <div className="w-px h-3 bg-border/80 ml-4" />

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-500">
                                <Home className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs uppercase font-black text-emerald-500 tracking-wider">2. Dépôt Client</p>
                                <p className="font-bold text-sm text-foreground truncate">{order.adresseClient}</p>
                                <p className="text-xs text-muted-foreground">Destinataire joignable au {order.telephoneClient}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenu de la commande */}
                    <div className="p-3 rounded-xl bg-card border border-border/50 text-xs space-y-1.5">
                        <p className="font-black text-muted-foreground uppercase text-2xs tracking-wider">Articles à livrer :</p>
                        <div className="flex flex-wrap gap-1.5">
                            {order.plats.map((plat, idx) => (
                                <Badge key={idx} variant="secondary" className="text-2xs font-bold py-0.5 px-2">
                                    {plat.quantite}x {plat.nom}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Tactile Action Buttons (Zone du pouce) */}
                    <div className="pt-2 flex flex-col gap-2">
                        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full h-12 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center transition-all active:scale-[0.98]"
                                    disabled={isCompleting || !canTransitionOrder(order.statut, 'Livrée', 'livreur')}
                                >
                                    {isCompleting ? (
                                        <Loader className="animate-spin mr-2 h-5 w-5" />
                                    ) : (
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                    )}
                                    Valider la course (Marquer comme livré)
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-headline font-black text-lg">
                                        {isEspeces ? "Encaissement Espèces Requis" : "Confirmer la Livraison"}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm space-y-2 text-muted-foreground">
                                        {isEspeces ? (
                                            <>
                                                <span>Avez-vous bien encaissé la somme de </span>
                                                <strong className="text-amber-500 font-black text-base block my-1">
                                                    {order.total.toLocaleString('fr-FR')} FCFA en espèces
                                                </strong>
                                                <span>auprès du client avant de lui remettre la commande ?</span>
                                            </>
                                        ) : (
                                            <span>
                                                Confirmez-vous avoir remis l&apos;intégralité des articles au client ? Le paiement a déjà été validé par Mobile Money / Carte.
                                            </span>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                                    <AlertDialogCancel className="rounded-xl font-bold">
                                        Vérifier encore
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleComplete}
                                        className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isEspeces ? "Oui, j'ai encaissé et livré" : "Oui, commande remise"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

