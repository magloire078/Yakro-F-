'use client';

import * as React from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import type { LivreurPublicData } from '@/lib/livreur-public';
import type { ClientLivePosition } from '@/lib/types';

export const CLIENT_POSITIONS_COLLECTION = 'positions_clients';

/** Intervalle minimal entre deux écritures de position client (ms). */
const CLIENT_WRITE_MIN_INTERVAL = 10_000;
/** Déplacement minimal (m) déclenchant une écriture avant l'intervalle. */
const CLIENT_WRITE_MIN_DISTANCE = 25;

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

/** Distance en mètres entre deux points (formule de haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
    const R = 6_371_000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function hasCoords<T extends { latitude?: number; longitude?: number }>(
    value: T | null | undefined,
): value is T & GeoPoint {
    return typeof value?.latitude === 'number' && typeof value?.longitude === 'number';
}

// Clé stable pour ne pas recréer les écouteurs quand seul l'ordre change.
function stableKey(ids: Array<string | undefined | null>): string {
    return Array.from(new Set(ids.filter((id): id is string => !!id))).sort().join('|');
}

/**
 * Positions publiques (collection `livreurs_public`) des livreurs donnés,
 * mises à jour en temps réel. Un livreur hors service n'a plus de document.
 */
export function useLivreurPositions(livreurIds: Array<string | undefined | null>) {
    const { db } = useFirebase();
    const key = stableKey(livreurIds);
    const [positions, setPositions] = React.useState<Record<string, LivreurPublicData>>({});

    React.useEffect(() => {
        if (!db || !key) {
            setPositions({});
            return;
        }
        const ids = key.split('|');
        const unsubscribes = ids.map((uid) =>
            onSnapshot(
                doc(db, 'livreurs_public', uid),
                (snap) => {
                    setPositions((prev) => {
                        const next = { ...prev };
                        if (snap.exists()) next[uid] = snap.data() as LivreurPublicData;
                        else delete next[uid];
                        return next;
                    });
                },
                (error) => console.error(`livreurs_public/${uid}:`, error),
            ),
        );
        // Retire les livreurs qui ne sont plus suivis.
        setPositions((prev) => Object.fromEntries(Object.entries(prev).filter(([uid]) => ids.includes(uid))));
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [db, key]);

    return positions;
}

/** Tous les livreurs en service (vue globale admin). */
export function useAllLivreurPositions(enabled: boolean) {
    const { db } = useFirebase();
    const [positions, setPositions] = React.useState<Record<string, LivreurPublicData>>({});

    React.useEffect(() => {
        if (!db || !enabled) return;
        return onSnapshot(
            collection(db, 'livreurs_public'),
            (snapshot) => {
                setPositions(
                    Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data() as LivreurPublicData])),
                );
            },
            (error) => console.error('livreurs_public:', error),
        );
    }, [db, enabled]);

    return positions;
}

/**
 * Positions GPS live partagées par les clients des commandes données
 * (document = id de commande). Les commandes sans partage actif sont
 * simplement absentes du résultat.
 */
export function useClientPositions(orderIds: Array<string | undefined | null>) {
    const { db } = useFirebase();
    const key = stableKey(orderIds);
    const [positions, setPositions] = React.useState<Record<string, ClientLivePosition>>({});

    React.useEffect(() => {
        if (!db || !key) {
            setPositions({});
            return;
        }
        const ids = key.split('|');
        const unsubscribes = ids.map((orderId) =>
            onSnapshot(
                doc(db, CLIENT_POSITIONS_COLLECTION, orderId),
                (snap) => {
                    setPositions((prev) => {
                        const next = { ...prev };
                        if (snap.exists()) next[orderId] = snap.data() as ClientLivePosition;
                        else delete next[orderId];
                        return next;
                    });
                },
                // Refus attendu si la commande n'existe plus ou ne nous concerne
                // plus : on ignore simplement ce point.
                () => {
                    setPositions((prev) => {
                        const next = { ...prev };
                        delete next[orderId];
                        return next;
                    });
                },
            ),
        );
        setPositions((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.includes(id))));
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [db, key]);

    return positions;
}

export type GeoWatchStatus = 'idle' | 'locating' | 'active' | 'denied' | 'unsupported' | 'error';

/** Suit la position de l'appareil (watchPosition) tant que `enabled` est vrai. */
export function useWatchPosition(enabled: boolean) {
    const [position, setPosition] = React.useState<GeoPoint | null>(null);
    const [status, setStatus] = React.useState<GeoWatchStatus>('idle');

    React.useEffect(() => {
        if (!enabled) {
            setStatus('idle');
            return;
        }
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setStatus('unsupported');
            return;
        }
        setStatus('locating');
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setStatus('active');
            },
            (error) => {
                setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
            },
            { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [enabled]);

    return { position, status };
}

/**
 * Partage la position GPS du client pour une commande tant que `enabled`
 * est vrai : écriture limitée (toutes les 10 s ou après 25 m), puis
 * suppression du document dès que le partage s'arrête.
 */
export function useClientPositionSharing(params: { orderId: string | null; userId: string | null; enabled: boolean }) {
    const { orderId, userId, enabled } = params;
    const { db } = useFirebase();
    const { position, status } = useWatchPosition(enabled && !!orderId && !!userId);
    const lastWriteRef = React.useRef<{ at: number; point: GeoPoint } | null>(null);
    const [writeError, setWriteError] = React.useState(false);

    React.useEffect(() => {
        if (!enabled || !db || !orderId || !userId || !position) return;
        const last = lastWriteRef.current;
        const now = Date.now();
        if (
            last &&
            now - last.at < CLIENT_WRITE_MIN_INTERVAL &&
            distanceMeters(last.point, position) < CLIENT_WRITE_MIN_DISTANCE
        ) {
            return;
        }
        lastWriteRef.current = { at: now, point: position };
        setDoc(doc(db, CLIENT_POSITIONS_COLLECTION, orderId), {
            userId,
            latitude: position.latitude,
            longitude: position.longitude,
            updatedAt: serverTimestamp(),
        })
            .then(() => setWriteError(false))
            .catch((error) => {
                console.error('Partage de position client échoué:', error);
                setWriteError(true);
            });
    }, [enabled, db, orderId, userId, position]);

    // Arrêt du partage (désactivation ou départ de la page) : on efface la
    // dernière position pour ne pas laisser de trace de localisation.
    React.useEffect(() => {
        if (!enabled || !db || !orderId) return;
        return () => {
            lastWriteRef.current = null;
            deleteDoc(doc(db, CLIENT_POSITIONS_COLLECTION, orderId)).catch(() => {
                // Document déjà absent ou commande close : rien à nettoyer.
            });
        };
    }, [enabled, db, orderId]);

    return { position, status, writeError };
}
