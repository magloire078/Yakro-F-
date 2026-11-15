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
    <div className="mx-auto max-w-5xl space-y-4 px-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-1 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Barre de retour et actions d'en-tête */}
      <div className="-mt-1 flex items-center justify-between gap-3">
        <Link
          href="/orders"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-3.5 text-[11.5px] font-bold text-[#4A443D] shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
        >
          ← Mes commandes
        </Link>

        {isCancellable && (
          <OrderCancelDialog orderId={liveOrder.id} />
        )}
      </div>

      {/* Héros « Yakro Elite » : statut, ETA, priorité */}
      <div className="overflow-hidden rounded-[1.75rem] bg-[#0B0B0D] text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
        <div className="px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Suivi en direct
              </p>
              <h1 className="yk-display mt-1.5 text-[27px] leading-none">
                Commande <span className="text-orange-400">#{liveOrder.id.slice(0, 6)}</span>
              </h1>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">{headline.subtitle}</p>
            </div>

            {liveOrder.prioritaire && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Crown className="h-3 w-3" /> VIP
              </span>
            )}
          </div>

          {liveOrder.statut === 'En Route' && livreurDistance !== null && (
            <div className="mt-4 flex items-end justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Arrivée estimée</p>
                <p className="yk-display text-[30px] leading-none text-orange-400">
                  ~{estimateArrivalMinutes(livreurDistance)} min
                </p>
              </div>
              <p className="pb-0.5 text-right text-[11px] font-medium text-white/55">
                Distance
                <br />
                <span className="text-[13px] font-bold text-white/80">{formatDistance(livreurDistance)}</span>
              </p>
            </div>
          )}
        </div>
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
          <div className="relative h-[300px] overflow-hidden rounded-[1.6rem] border border-black/[0.06] bg-muted/40 shadow-[0_24px_50px_-28px_rgba(22,19,15,0.4)] dark:border-white/[0.08] sm:h-96 md:h-[420px]">
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
            <label className="yk-card flex cursor-pointer items-center gap-3.5 p-3.5 transition-colors hover:border-sky-500/30">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border border-sky-500/20 bg-sky-500/10">
                <Navigation className="h-5 w-5 text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-bold text-foreground">Partager ma position GPS en direct</p>
                  {shareLocation && sharing.status === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
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
          <div className="yk-card flex items-start gap-3.5 p-4">
            <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-500">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="yk-label">
                Restaurant
              </p>
              <p className="mt-0.5 truncate text-[13.5px] font-bold text-foreground">{restaurant?.nom || liveOrder.nomRestaurant}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{restaurant?.adresse || liveOrder.adresseRestaurant}</p>
            </div>
          </div>

          {/* Fiche Livreur */}
          <div className="yk-card flex items-start gap-3.5 p-4">
            <div className="h-11 w-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500">
              <Bike className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="yk-label">
                Livreur
              </p>
              <p className="mt-0.5 truncate text-[13.5px] font-bold text-foreground">
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
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  Localisation disponible dès la prise en charge
                </p>
              )}
            </div>
          </div>

          {/* Fiche Adresse Client */}
          <div className="yk-card flex items-start gap-3.5 p-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500">
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="yk-label">
                Destination
              </p>
              <p className="mt-0.5 text-[12.5px] font-bold leading-snug text-foreground">
                {liveOrder.adresseClient}
              </p>
              <p className="text-2xs text-muted-foreground mt-0.5">Tél : {liveOrder.telephoneClient}</p>
            </div>
          </div>

          {/* Fiche Paiement */}
          <div className="yk-card flex items-start gap-3.5 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="yk-label">
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
          <div className="yk-card space-y-2 p-4 text-center">
            <p className="yk-label">Besoin d’aide sur cette course ?</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full gap-1.5 rounded-full text-[12px] font-bold"
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
