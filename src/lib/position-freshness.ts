// Fraîcheur d'une position publiée en direct (livreurs). Un livreur publie
// toutes les 10 s tant que son app est ouverte : au-delà de quelques
// minutes sans nouvelle position, son app est fermée ou hors réseau.

/** Au-delà, la position n'est plus « en direct » : signal perdu. */
export const POSITION_STALE_AFTER_MS = 2 * 60_000;

/** Au-delà, la position est trop ancienne pour être affichée. */
export const POSITION_EXPIRED_AFTER_MS = 30 * 60_000;

export type PositionFreshness = 'live' | 'stale' | 'expired';

/** Toute valeur offrant `toMillis()` (Timestamp Firestore). */
interface MillisSource {
    toMillis(): number;
}

/**
 * Classe une position selon l'âge de sa dernière mise à jour. Une position
 * sans horodatage (publiée avant l'ajout de `updatedAt`) est considérée
 * expirée : un livreur réellement actif republie dans les 10 secondes.
 */
export function positionFreshness(updatedAt: MillisSource | null | undefined, now: number): PositionFreshness {
    if (!updatedAt) return 'expired';
    const age = now - updatedAt.toMillis();
    if (age > POSITION_EXPIRED_AFTER_MS) return 'expired';
    if (age > POSITION_STALE_AFTER_MS) return 'stale';
    return 'live';
}

/** « il y a 4 min », « il y a 1 h » — pour les positions figées. */
export function formatPositionAge(updatedAt: MillisSource, now: number): string {
    const minutes = Math.max(1, Math.round((now - updatedAt.toMillis()) / 60_000));
    if (minutes < 60) return `il y a ${minutes} min`;
    return `il y a ${Math.round(minutes / 60)} h`;
}
