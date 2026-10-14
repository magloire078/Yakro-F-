'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { MapMarker, MapRoute, Order, Restaurant } from '@/lib/types';
import {
  Loader,
  MapPin,
  Bike,
  Home,
  Wallet,
  Navigation,
  Crown,
  ChefHat,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LiveMap } from '@/components/map/live-map';
import {
  hasCoords,
  orderClientPoint,
  orderRestaurantPoint,
  useClientPositionSharing,
  useLivreurPositions,
  useNow,
} from '@/hooks/use-live-locations';
import { formatPositionAge, positionFreshness } from '@/lib/position-freshness';
import Link from 'next/link';
import { initiateMobileMoneyPaymentAction } from '@/app/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';
import {
  ARRIVAL_ALERT_DISTANCE_M,
  distanceMeters,
  estimateArrivalMinutes,
  formatDistance,
} from '@/lib/delivery-eta';
import {
  fireBrowserNotification,
  requestBrowserNotificationPermission,
} from '@/lib/browser-notifications';
import { OrderTrackingStepper } from '@/components/orders/order-tracking-stepper';
import { OrderItemsCard } from '@/components/orders/order-items-card';
import { OrderCancelDialog } from '@/components/orders/order-cancel-dialog';
import { OrderDeliveredBanner } from '@/components/orders/order-delivered-banner';
import {
  getStatusHeadline,
  isOrderCancellableByClient,
} from '@/lib/order-status-info';

// Clé de session : l'alerte « livreur tout proche » n'est montrée qu'une fois
// par commande, même si la page est rechargée ou si le livreur s'éloigne
// puis revient.
const arrivalAlertKey = (orderId: string) => `yakro-arrival-alert-${orderId}`;

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

  // Position du livreur assigné
  const livreurPositions = useLivreurPositions([liveOrder?.livreurId]);
  const livreur = liveOrder?.livreurId ? livreurPositions[liveOrder.livreurId] ?? null : null;

  const isOrderActive = !!liveOrder && !['Livrée', 'Annulée'].includes(liveOrder.statut);
  const sharing = useClientPositionSharing({
    orderId,
    userId: user?.uid ?? null,
    enabled: shareLocation && isOrderActive,
  });

  // Le partage s'arrête de lui-même quand la commande est terminée
  React.useEffect(() => {
    if (!isOrderActive) setShareLocation(false);
  }, [isOrderActive]);

  React.useEffect(() => {
    if (sharing.status === 'denied') {
      setShareLocation(false);
      toast({
        variant: 'destructive',
        title: 'Position refusée',
        description: 'Autorisez la localisation dans votre navigateur pour la partager avec le livreur.',
      });
    } else if (sharing.status === 'unsupported') {
      setShareLocation(false);
      toast({
        variant: 'destructive',
        title: 'Localisation indisponible',
        description: 'Votre appareil ne permet pas de partager votre position.',
      });
    }
  }, [sharing.status, toast]);

  const now = useNow();
  const livreurFreshness = positionFreshness(livreur?.updatedAt, now);
  const livreurPosition = hasCoords(livreur) && livreurFreshness !== 'expired' ? livreur : null;
  const isLivreurLive = !!livreurPosition && livreurFreshness === 'live';

  // Distance livreur -> client
  const destination = sharing.position ?? (liveOrder ? orderClientPoint(liveOrder) : null);
  const livreurDistance =
    liveOrder?.statut === 'En Route' && isLivreurLive && livreurPosition && destination
      ? distanceMeters(livreurPosition, destination)
      : null;
  const isEnRoute = liveOrder?.statut === 'En Route';

  // Demande l'autorisation des notifications au départ du livreur
  React.useEffect(() => {
    if (isEnRoute) void requestBrowserNotificationPermission();
  }, [isEnRoute]);

  React.useEffect(() => {
    if (!orderId || livreurDistance === null || livreurDistance > ARRIVAL_ALERT_DISTANCE_M) return;
    try {
      if (sessionStorage.getItem(arrivalAlertKey(orderId))) return;
      sessionStorage.setItem(arrivalAlertKey(orderId), '1');
    } catch {
      // Stockage indisponible (navigation privée)
    }
    const title = 'Votre livreur arrive !';
    const body = `${livreur?.nom || 'Le livreur'} est à ${formatDistance(livreurDistance)}. Préparez-vous à recevoir votre commande.`;
    toast({ title, description: body });
    fireBrowserNotification(title, { body, icon: '/favicon.ico', tag: arrivalAlertKey(orderId) });
  }, [orderId, livreurDistance, livreur?.nom, toast]);

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
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de relancer le paiement pour le moment.',
      });
    } finally {
      setIsRetryingPayment(false);
    }
  };

  React.useEffect(() => {
    if (!orderId || !db) return;

    const initialOrder = getOrder(orderId);
    if (initialOrder) setLiveOrder(initialOrder);

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
      } else {
        router.push('/');
      }
    });
    return () => unsubscribeOrder();
  }, [orderId, user, router, getRestaurant, db, getOrder]);

  if (!orderId) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground font-semibold">Identifiant de commande manquant.</p>
        <Button asChild className="rounded-xl font-bold">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    );
  }

  if (!liveOrder) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Synchronisation de la commande...
          </p>
        </div>
      </div>
    );
  }

  const headline = getStatusHeadline(liveOrder.statut);
  const restaurantPoint = hasCoords(restaurant)
    ? restaurant
    : orderRestaurantPoint(liveOrder);
  const clientPoint = sharing.position ?? orderClientPoint(liveOrder);

  const mapMarkers: MapMarker[] = [];
  if (restaurantPoint) {
    mapMarkers.push({
      id: 'restaurant',
      kind: 'restaurant',
      ...restaurantPoint,
      label: restaurant?.nom || liveOrder.nomRestaurant,
      sublabel: restaurant?.adresse || liveOrder.adresseRestaurant,
    });
  }
  if (livreurPosition) {
    mapMarkers.push({
      id: 'livreur',
      kind: 'livreur',
      latitude: livreurPosition.latitude,
      longitude: livreurPosition.longitude,
      label: livreurPosition.nom || 'Votre livreur',
      sublabel:
        !isLivreurLive && livreurPosition.updatedAt
          ? `Signal perdu ${formatPositionAge(livreurPosition.updatedAt, now)}`
          : undefined,
      live: isLivreurLive,
    });
  }
  if (clientPoint) {
    mapMarkers.push({
      id: 'client',
      kind: 'client',
      ...clientPoint,
      label: sharing.position ? 'Vous (position en direct)' : 'Adresse de livraison',
      sublabel: liveOrder.adresseClient,
      live: !!sharing.position,
    });
  }

  const mapRoutes: MapRoute[] = [];
  if (restaurantPoint && clientPoint) {
    const points: Array<[number, number]> = [[restaurantPoint.latitude, restaurantPoint.longitude]];
    if (livreurPosition && liveOrder.statut === 'En Route') {
      points.push([livreurPosition.latitude, livreurPosition.longitude]);
    }
    points.push([clientPoint.latitude, clientPoint.longitude]);
    mapRoutes.push({
      id: 'trajet',
      points,
      status: liveOrder.statut === 'En Route' ? 'active' : 'planned',
    });
  }

  const isCancellable = isOrderCancellableByClient(liveOrder);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Barre de retour et actions d'en-tête */}
      <div className="flex items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          className="text-2xs sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-orange-500 h-8 px-2"
        >
          <Link href="/orders">
            ← Mes commandes
          </Link>
        </Button>

        {isCancellable && (
          <OrderCancelDialog orderId={liveOrder.id} />
        )}
      </div>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 sm:h-4 w-1.5 flex-col rounded-full overflow-hidden shrink-0 shadow-xs">
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-white dark:bg-slate-300" />
              <div className="flex-1 bg-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
              Suivi en direct · Yakro-Fê
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black italic uppercase tracking-tighter text-foreground leading-none">
              Commande <span className="text-orange-500">#{liveOrder.id.slice(0, 6)}</span>
            </h1>

            {liveOrder.prioritaire && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-2xs sm:text-xs font-black uppercase tracking-wider">
                <Crown className="h-3 w-3" /> VIP Prioritaire
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {headline.subtitle}
          </p>
        </div>

        {/* ETA Badge si En Route */}
        {liveOrder.statut === 'En Route' && livreurDistance !== null && (
          <div className="p-3 sm:p-4 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                Arrivée estimée
              </p>
              <p className="text-lg sm:text-xl font-headline font-black text-foreground">
                ~{estimateArrivalMinutes(livreurDistance)} min
              </p>
              <p className="text-2xs text-muted-foreground font-semibold">
                Distance : {formatDistance(livreurDistance)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stepper de progression */}
      <OrderTrackingStepper status={liveOrder.statut} />

      {/* Bannière de célébration si Livrée */}
      {liveOrder.statut === 'Livrée' && (
        <OrderDeliveredBanner order={liveOrder} />
      )}

      {/* Grille principale : Carte & Données */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Colonne gauche (2/3) : Carte et partage GPS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative h-80 sm:h-96 md:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden bg-muted/40 border border-border/50 shadow-xl">
            {mapMarkers.length > 0 ? (
              <LiveMap markers={mapMarkers} routes={mapRoutes} className="h-full w-full" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <MapPin className="h-8 w-8 opacity-40" />
                <p className="text-[11px] font-black uppercase tracking-widest">Carte indisponible</p>
              </div>
            )}
          </div>

          {/* Partage GPS en direct */}
          {isOrderActive && (
            <label className="flex items-center gap-3.5 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 cursor-pointer shadow-sm hover:border-sky-500/30 transition-all">
              <div className="h-11 w-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Navigation className="h-5 w-5 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">Partager ma position GPS en direct</p>
                  {shareLocation && sharing.status === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {shareLocation
                    ? sharing.status === 'active'
                      ? sharing.writeError
                        ? 'Envoi impossible pour le moment, nouvel essai en cours…'
                        : 'Le livreur et le restaurant voient votre position jusqu’à la livraison.'
                      : 'Localisation en cours…'
                    : 'Aide le livreur à vous trouver au mètre près. S’arrête automatiquement à la livraison.'}
                </p>
              </div>
              <Switch
                checked={shareLocation}
                onCheckedChange={setShareLocation}
                aria-label="Partager ma position en direct"
              />
            </label>
          )}

          {/* Récapitulatif des articles */}
          <OrderItemsCard order={liveOrder} />
        </div>

        {/* Colonne droite (1/3) : Fiches d'informations */}
        <div className="space-y-4">
          {/* Fiche Restaurant */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-500">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Restaurant
              </p>
              <p className="font-bold text-foreground truncate mt-0.5">{restaurant?.nom || liveOrder.nomRestaurant}</p>
              <p className="text-xs text-muted-foreground truncate">{restaurant?.adresse || liveOrder.adresseRestaurant}</p>
            </div>
          </div>

          {/* Fiche Livreur */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500">
              <Bike className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Livreur
              </p>
              <p className="font-bold text-foreground truncate mt-0.5">
                {livreur?.nom || "En attente d'assignation…"}
              </p>
              {livreurDistance !== null ? (
                <p className="text-xs font-bold text-orange-500 mt-1">
                  À {formatDistance(livreurDistance)} · arrivée estimée ~{estimateArrivalMinutes(livreurDistance)} min
                </p>
              ) : livreurPosition && !isLivreurLive && livreurPosition.updatedAt ? (
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                  Signal perdu {formatPositionAge(livreurPosition.updatedAt, now)}
                </p>
              ) : livreurPosition ? (
                <p className="text-xs font-bold text-orange-500 animate-pulse mt-1">En mouvement…</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Localisation disponible dès la prise en charge
                </p>
              )}
            </div>
          </div>

          {/* Fiche Adresse Client */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500">
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Destination
              </p>
              <p className="font-bold text-foreground text-xs sm:text-sm mt-0.5 leading-snug">
                {liveOrder.adresseClient}
              </p>
              <p className="text-2xs text-muted-foreground mt-0.5">Tél : {liveOrder.telephoneClient}</p>
            </div>
          </div>

          {/* Fiche Paiement */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Paiement
              </p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-foreground">
                  {liveOrder.paiement.mode === 'especes'
                    ? 'Espèces à la livraison'
                    : 'Mobile Money'}
                </span>
                <span
                  className={`text-2xs font-black uppercase px-2 py-0.5 rounded-md border ${
                    liveOrder.paiement.statut === 'paye'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : liveOrder.paiement.statut === 'echoue'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {liveOrder.paiement.statut === 'paye'
                    ? 'Payé'
                    : liveOrder.paiement.statut === 'echoue'
                    ? 'Échoué'
                    : 'En attente'}
                </span>
              </div>

              {liveOrder.paiement.mode !== 'especes' && liveOrder.paiement.statut !== 'paye' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/5"
                  onClick={handleRetryPayment}
                  disabled={isRetryingPayment}
                >
                  {isRetryingPayment ? (
                    <Loader className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Relancer le paiement en ligne
                </Button>
              )}
            </div>
          </div>

          {/* Assistance & Support WhatsApp */}
          <div className="p-4 rounded-2xl bg-background/40 border border-border/40 text-center space-y-2">
            <p className="text-2xs font-black uppercase tracking-wider text-muted-foreground">
              Besoin d’aide sur cette course ?
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <a
                href={`https://wa.me/2250700000000?text=${encodeURIComponent(
                  `Bonjour Yakro-Fê, j’ai une question concernant ma commande #${liveOrder.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                Contacter le support client
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-dvh w-full items-center justify-center">
          <Loader className="h-12 w-12 animate-spin text-orange-500" />
        </div>
      }
    >
      <TrackOrderContent />
    </React.Suspense>
  );
}
