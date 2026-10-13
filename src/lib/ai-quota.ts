// Quotas quotidiens d'utilisation de l'IA par utilisateur. Les appels IA
// sont facturés au projet : un compte (même légitime) ne doit pas pouvoir
// les déclencher sans limite.

export type AiQuotaBucket = 'text' | 'media';

/** Appels autorisés par utilisateur et par jour (UTC, l'heure d'Abidjan). */
export const AI_DAILY_LIMITS: Record<AiQuotaBucket, number> = {
    // Recherche, recommandations, assistant, avis, fiche de plat.
    text: 100,
    // Images et narration audio, nettement plus coûteuses.
    media: 20,
};

export interface AiQuotaUsage {
    text?: number;
    media?: number;
}

/** Jour de comptage au format AAAA-MM-JJ (UTC). */
export function quotaDay(now: Date): string {
    return now.toISOString().slice(0, 10);
}

/** Identifiant du document de compteur : un par utilisateur et par jour. */
export function quotaDocId(uid: string, now: Date): string {
    return `${uid}_${quotaDay(now)}`;
}

/** Vrai si un appel supplémentaire de ce type reste permis aujourd'hui. */
export function isWithinAiQuota(usage: AiQuotaUsage | undefined, bucket: AiQuotaBucket): boolean {
    return (usage?.[bucket] ?? 0) < AI_DAILY_LIMITS[bucket];
}

export function aiQuotaExceededMessage(bucket: AiQuotaBucket): string {
    return bucket === 'media'
        ? `Limite quotidienne atteinte (${AI_DAILY_LIMITS.media} images ou narrations par jour). Réessayez demain.`
        : `Limite quotidienne atteinte (${AI_DAILY_LIMITS.text} requêtes IA par jour). Réessayez demain.`;
}

/**
 * Vrai pour les refus d'accès à l'IA à montrer tels quels à l'utilisateur
 * (connexion requise, limite quotidienne atteinte), par opposition aux
 * pannes techniques, qui gardent un message générique.
 */
export function isAiAccessMessage(message: string | undefined | null): message is string {
    return !!message && (message.startsWith('Connectez-vous') || message.startsWith('Limite quotidienne'));
}
