import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoLocationCoords {
    latitude: number;
    longitude: number;
}

/**
 * Raison normalisée d'un échec de géolocalisation, quelle que soit la source
 * (plugin natif Capacitor ou API navigateur) — les deux exposent des formes
 * d'erreur différentes et incompatibles, ce qui empêchait tout appelant de
 * distinguer de façon fiable un refus de permission d'un simple délai
 * dépassé (le code affichait systématiquement le même message générique).
 */
export type GeolocationFailureReason = 'permission-denied' | 'unavailable' | 'timeout' | 'unsupported';

export class GeolocationFailure extends Error {
    readonly reason: GeolocationFailureReason;
    constructor(reason: GeolocationFailureReason) {
        super(`Geolocation failure: ${reason}`);
        this.name = 'GeolocationFailure';
        this.reason = reason;
    }
}

/** Traduit une `GeolocationPositionError` native du navigateur en raison normalisée. */
export function classifyBrowserGeolocationError(error: Pick<GeolocationPositionError, 'code'>): GeolocationFailureReason {
    switch (error.code) {
        case 1: return 'permission-denied'; // GeolocationPositionError.PERMISSION_DENIED
        case 3: return 'timeout'; // GeolocationPositionError.TIMEOUT
        case 2: // GeolocationPositionError.POSITION_UNAVAILABLE
        default:
            return 'unavailable';
    }
}

/** Coordonnées de référence du Centre-ville de Yamoussoukro (Mairie / Grande Mosquée / Basilique) */
export const YAKRO_DEFAULT_COORDS: GeoLocationCoords = {
    latitude: 6.8276,
    longitude: -5.2893,
};

/**
 * Coordonnées posées automatiquement par l'ancienne création de restaurant
 * quand aucune position n'était saisie (centre-ville approximatif).
 */
const LEGACY_PLACEHOLDER_COORDS: GeoLocationCoords = { latitude: 6.82, longitude: -5.28 };

/**
 * Vrai si le point porte une vraie position : renseignée, différente de
 * (0, 0) — valeur produite par un champ vide converti en nombre — et du
 * centre-ville posé par défaut à la création.
 */
export function hasReliableLocation(point: { latitude?: number | null; longitude?: number | null } | null | undefined): point is GeoLocationCoords {
    if (typeof point?.latitude !== 'number' || typeof point?.longitude !== 'number') return false;
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return false;
    if (point.latitude === 0 && point.longitude === 0) return false;
    if (point.latitude === LEGACY_PLACEHOLDER_COORDS.latitude && point.longitude === LEGACY_PLACEHOLDER_COORDS.longitude) return false;
    return true;
}

export async function getCurrentLocation(): Promise<GeoLocationCoords> {
    if (Capacitor.isNativePlatform()) {
        try {
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
                const request = await Geolocation.requestPermissions();
                if (request.location !== 'granted') {
                    throw new GeolocationFailure('permission-denied');
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 8000,
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch (error) {
            console.error('Capacitor Geolocation error:', error);
            if (error instanceof GeolocationFailure && error.reason === 'permission-denied') {
                // Un refus explicite ne se résoudra pas en retombant sur l'API
                // navigateur du même WebView — inutile d'attendre un second
                // échec identique.
                throw error;
            }
            return getBrowserLocation();
        }
    } else {
        return getBrowserLocation();
    }
}

function getBrowserLocation(): Promise<GeoLocationCoords> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            reject(new GeolocationFailure('unsupported'));
            return;
        }

        // Essai 1 : Haute précision avec timeout de 5s
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (firstError) => {
                // Un refus de permission ne se résoudra pas en retentant avec
                // d'autres réglages de précision — inutile de faire attendre
                // l'utilisateur jusqu'à 7s de plus pour le même refus.
                if (classifyBrowserGeolocationError(firstError) === 'permission-denied') {
                    reject(new GeolocationFailure('permission-denied'));
                    return;
                }
                // Essai 2 : Basse précision (IP / Wi-Fi réseau, fonctionne sur PC/Mac sans GPS matériel)
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (secondError) => {
                        reject(new GeolocationFailure(classifyBrowserGeolocationError(secondError || firstError)));
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 7000,
                        maximumAge: 60000,
                    }
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 30000,
            }
        );
    });
}
