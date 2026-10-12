'use client';

import * as React from 'react';
import { LiveMap } from '@/components/map/live-map';
import { hasCoords, orderClientPoint, orderRestaurantPoint, useAllLivreurPositions, useClientPositions, useLivreurPositions, useNow } from '@/hooks/use-live-locations';
import { formatPositionAge, positionFreshness } from '@/lib/position-freshness';
import type { MapMarker, MapRoute, Order, Restaurant } from '@/lib/types';

const ACTIVE_STATUSES: Order['statut'][] = ['Placée', 'En Préparation', 'Prête', 'En Route'];

interface OperationsMapProps {
    restaurants: Restaurant[];
    orders: Order[];
    /**
     * `all` : tous les livreurs en service (vue admin).
     * `assigned` : uniquement les livreurs des commandes affichées.
     */
    livreurScope: 'all' | 'assigned';
    className?: string;
}

/**
 * Carte opérationnelle temps réel : restaurants, commandes en cours (client
 * en direct s'il partage sa position, sinon adresse de livraison) et
 * livreurs, avec le trajet de chaque commande.
 */
export function OperationsMap({ restaurants, orders, livreurScope, className }: OperationsMapProps) {
    const activeOrders = React.useMemo(
        () => orders.filter((o) => ACTIVE_STATUSES.includes(o.statut)),
        [orders],
    );

    const allLivreurs = useAllLivreurPositions(livreurScope === 'all');
    const assignedLivreurs = useLivreurPositions(
        livreurScope === 'assigned' ? activeOrders.map((o) => o.livreurId) : [],
    );
    const livreurs = livreurScope === 'all' ? allLivreurs : assignedLivreurs;
    const clientPositions = useClientPositions(activeOrders.map((o) => o.id));
    const now = useNow();

    const { markers, routes } = React.useMemo(() => {
        const markers: MapMarker[] = [];
        const routes: MapRoute[] = [];
        const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

        restaurants.filter(hasCoords).forEach((r) => {
            markers.push({
                id: `restaurant-${r.id}`,
                kind: 'restaurant',
                latitude: r.latitude,
                longitude: r.longitude,
                label: r.nom,
                sublabel: r.adresse,
            });
        });

        // Livreurs dont la position est exploitable : une position expirée
        // (app fermée sans passer hors service) n'est ni affichée ni utilisée
        // pour tracer les trajets.
        const visibleLivreurs = Object.fromEntries(
            Object.entries(livreurs).filter(([, livreur]) => hasCoords(livreur) && positionFreshness(livreur.updatedAt, now) !== 'expired'),
        );

        Object.entries(visibleLivreurs).forEach(([uid, livreur]) => {
            if (!hasCoords(livreur)) return;
            const mission = activeOrders.find((o) => o.livreurId === uid && o.statut === 'En Route');
            const isLive = positionFreshness(livreur.updatedAt, now) === 'live';
            const activity = mission ? `En livraison · ${mission.nomRestaurant}` : 'Disponible';
            markers.push({
                id: `livreur-${uid}`,
                kind: 'livreur',
                latitude: livreur.latitude,
                longitude: livreur.longitude,
                label: livreur.nom || 'Livreur',
                sublabel: isLive || !livreur.updatedAt
                    ? activity
                    : `Signal perdu ${formatPositionAge(livreur.updatedAt, now)} · ${activity}`,
                live: isLive,
            });
        });

        activeOrders.forEach((order) => {
            const live = clientPositions[order.id];
            const clientPoint = live
                ? { latitude: live.latitude, longitude: live.longitude }
                : orderClientPoint(order);
            if (!clientPoint) return;

            markers.push({
                id: `client-${order.id}`,
                kind: 'client',
                ...clientPoint,
                label: `Commande #${order.id.slice(-6).toUpperCase()} · ${order.statut}`,
                sublabel: order.adresseClient,
                live: !!live,
            });

            const restaurant = restaurantById.get(order.restaurantId);
            const restaurantPoint = hasCoords(restaurant)
                ? restaurant
                : orderRestaurantPoint(order);
            if (!restaurantPoint) return;

            const points: Array<[number, number]> = [[restaurantPoint.latitude, restaurantPoint.longitude]];
            const livreur = order.livreurId ? visibleLivreurs[order.livreurId] : undefined;
            if (order.statut === 'En Route' && hasCoords(livreur)) points.push([livreur.latitude, livreur.longitude]);
            points.push([clientPoint.latitude, clientPoint.longitude]);
            routes.push({ id: `route-${order.id}`, points, status: order.statut === 'En Route' ? 'active' : 'planned' });
        });

        return { markers, routes };
    }, [restaurants, activeOrders, livreurs, clientPositions, now]);

    return <LiveMap markers={markers} routes={routes} className={className} />;
}
