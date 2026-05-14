/**
 * Constantes géographiques partagées par l'app Yakro Fê.
 *
 * Centralise les valeurs hardcodées qui apparaissaient dans plusieurs
 * fichiers (centre de Yamoussoukro, bornes de la Côte d'Ivoire, etc.)
 * et fournit les helpers de validation associés.
 */

/** Centre approximatif de Yamoussoukro (Basilique Notre-Dame de la Paix). */
export const YAKRO_DEFAULT_LOCATION = {
  latitude: 6.82,
  longitude: -5.28,
} as const;

/**
 * Bounding box approximative du territoire ivoirien.
 * Utilisé pour valider les coordonnées GPS avant écriture en base.
 * Marges incluses pour éviter de rejeter des positions limites légitimes.
 */
export const CI_BOUNDS = {
  minLatitude: 4.0,
  maxLatitude: 11.0,
  minLongitude: -9.0,
  maxLongitude: -2.0,
} as const;

/**
 * Vérifie qu'une coordonnée GPS est plausiblement en Côte d'Ivoire.
 * Pas un contrôle anti-fraude rigoureux — un garde-fou utilitaire qui
 * empêche les valeurs aberrantes (ex: position usurpée pointant Paris).
 */
export function isWithinCoteIvoire(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= CI_BOUNDS.minLatitude
    && latitude <= CI_BOUNDS.maxLatitude
    && longitude >= CI_BOUNDS.minLongitude
    && longitude <= CI_BOUNDS.maxLongitude
  );
}

/**
 * Calcule la distance "à vol d'oiseau" entre deux points GPS, en km,
 * via la formule de Haversine. Précision suffisante pour le tri par
 * distance dans un catalogue urbain.
 */
export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371; // rayon terrestre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2
    + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
