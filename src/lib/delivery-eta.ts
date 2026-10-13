// Estimations de distance et d'heure d'arrivée pour le suivi de livraison.
// Calculs à vol d'oiseau corrigés d'un facteur de détour : aucune API de
// calcul d'itinéraire n'est utilisée, ce sont donc des ordres de grandeur.

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

/** Distance à laquelle le client est prévenu que le livreur arrive. */
export const ARRIVAL_ALERT_DISTANCE_M = 500;

/** Vitesse moyenne d'une moto de livraison en ville (km/h). */
const AVERAGE_SPEED_KMH = 22;

/** Les routes ne sont pas droites : distance réelle ≈ vol d'oiseau × 1,35. */
const ROAD_DETOUR_FACTOR = 1.35;

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

/** Temps de trajet estimé (minutes, arrondi au-dessus, au moins 1). */
export function estimateArrivalMinutes(straightDistanceM: number): number {
    const roadKm = (straightDistanceM * ROAD_DETOUR_FACTOR) / 1000;
    return Math.max(1, Math.ceil((roadKm / AVERAGE_SPEED_KMH) * 60));
}

/** « 850 m », « 2,4 km » — arrondi pour rester lisible. */
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
    return `${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}
