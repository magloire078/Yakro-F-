import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { haversineDistanceKm } from './geo-constants';

export interface GeoLocationCoords {
    latitude: number;
    longitude: number;
}

const DEFAULT_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10_000,
    /** ms — accept a recent fix instead of forcing a new GPS read each time */
    maximumAge: 30_000,
};

export async function getCurrentLocation(): Promise<GeoLocationCoords> {
    if (Capacitor.isNativePlatform()) {
        try {
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
                const request = await Geolocation.requestPermissions();
                if (request.location !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: DEFAULT_OPTIONS.enableHighAccuracy,
                timeout: DEFAULT_OPTIONS.timeout,
                maximumAge: DEFAULT_OPTIONS.maximumAge,
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch (error) {
            console.error('Capacitor Geolocation error:', error);
            // Fallback to browser geolocation even on native (sometimes works
            // better in certain webviews).
            return getBrowserLocation();
        }
    }
    return getBrowserLocation();
}

function getBrowserLocation(): Promise<GeoLocationCoords> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }),
            (error) => reject(error),
            DEFAULT_OPTIONS,
        );
    });
}

export interface WatchLocationOptions {
    /** Distance minimum (m) entre deux notifications. Défaut: 50. */
    minDistanceMeters?: number;
    /** Délai minimum (ms) entre deux notifications. Défaut: 30_000. */
    minIntervalMs?: number;
}

/**
 * Décide si une nouvelle position doit être propagée au callback du
 * `watchLocation`, selon le throttle distance + temps. Pure, testable.
 */
export function shouldEmitLocation(
    next: GeoLocationCoords,
    nextTimeMs: number,
    last: GeoLocationCoords | null,
    lastTimeMs: number | null,
    options: Required<WatchLocationOptions>,
): boolean {
    if (!last || lastTimeMs === null) return true;
    const elapsed = nextTimeMs - lastTimeMs;
    if (elapsed >= options.minIntervalMs) return true;
    const distanceKm = haversineDistanceKm(last, next);
    return distanceKm * 1000 >= options.minDistanceMeters;
}

/**
 * Suit la position de l'utilisateur en continu, en remontant uniquement
 * les changements significatifs (≥ 50 m OU ≥ 30 s écoulées par défaut).
 * Renvoie une fonction de cleanup à appeler au démontage.
 *
 * Utilise `Geolocation.watchPosition` sur natif (Capacitor), ou
 * `navigator.geolocation.watchPosition` sur web.
 */
export function watchLocation(
    onUpdate: (coords: GeoLocationCoords) => void,
    onError: (error: Error) => void,
    options: WatchLocationOptions = {},
): () => void {
    const opts: Required<WatchLocationOptions> = {
        minDistanceMeters: options.minDistanceMeters ?? 50,
        minIntervalMs: options.minIntervalMs ?? 30_000,
    };
    let lastEmitted: GeoLocationCoords | null = null;
    let lastEmittedAt: number | null = null;

    const emitIfNeeded = (coords: GeoLocationCoords) => {
        const now = Date.now();
        if (!shouldEmitLocation(coords, now, lastEmitted, lastEmittedAt, opts)) return;
        lastEmitted = coords;
        lastEmittedAt = now;
        onUpdate(coords);
    };

    if (Capacitor.isNativePlatform()) {
        const watchIdPromise = Geolocation.watchPosition(
            { enableHighAccuracy: DEFAULT_OPTIONS.enableHighAccuracy, timeout: DEFAULT_OPTIONS.timeout },
            (position, err) => {
                if (err) {
                    onError(err instanceof Error ? err : new Error(String(err)));
                    return;
                }
                if (!position) return;
                emitIfNeeded({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
        );
        return () => {
            void watchIdPromise.then((id) => {
                Geolocation.clearWatch({ id }).catch(() => undefined);
            });
        };
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        onError(new Error('Geolocation not supported'));
        return () => undefined;
    }

    const id = navigator.geolocation.watchPosition(
        (position) => emitIfNeeded({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }),
        (err) => onError(new Error(err.message)),
        DEFAULT_OPTIONS,
    );
    return () => navigator.geolocation.clearWatch(id);
}
