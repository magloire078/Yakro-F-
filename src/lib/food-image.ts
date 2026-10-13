// Résolution des URL de photos de plats et de restaurants.

/** Hôtes déclarés dans `images.remotePatterns` (next.config.ts) : optimisables par next/image. */
const OPTIMIZABLE_HOSTS = new Set([
    'firebasestorage.googleapis.com',
    'images.unsplash.com',
    'placehold.co',
    'maps.googleapis.com',
]);

export type FoodImageSource =
    | { type: 'cloudinary'; src: string }
    | { type: 'optimized'; src: string }
    /** Aperçu local (data:/blob:) ou hôte non déclaré : affiché sans optimisation. */
    | { type: 'unoptimized'; src: string };

/**
 * Classe l'URL d'une photo, ou renvoie `null` quand il n'y a rien
 * d'affichable : valeur vide, URL invalide, ou ancienne image aléatoire
 * picsum.photos (paysages sans rapport avec la cuisine).
 */
export function resolveFoodImageSource(src: string | null | undefined): FoodImageSource | null {
    const value = src?.trim();
    if (!value) return null;
    if (value.startsWith('data:image/') || value.startsWith('blob:')) return { type: 'unoptimized', src: value };
    if (value.startsWith('/')) return { type: 'optimized', src: value };

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.hostname === 'picsum.photos' || url.hostname.endsWith('.picsum.photos')) return null;
    if (url.hostname === 'res.cloudinary.com') return { type: 'cloudinary', src: value };
    if (OPTIMIZABLE_HOSTS.has(url.hostname)) return { type: 'optimized', src: value };
    return { type: 'unoptimized', src: value };
}
