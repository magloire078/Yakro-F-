// Identifiants Cloudinary (public_id) des photos de plats et de restaurants.
// Chaque envoi crée `plats/<id>-<horodatage>` ; les anciens envois portaient
// `plats/<id>`. Toutes ces versions appartiennent au même plat.

export type ImageEntityKind = 'plat' | 'restaurant';

const FOLDERS: Record<ImageEntityKind, string> = {
    plat: 'plats',
    restaurant: 'restaurants',
};

/** Identifiant Firestore acceptable (évite toute injection dans le préfixe). */
export function isSafeEntityId(id: string): boolean {
    return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/** Base des public_id d'une entité, ex. `plats/abc123`. */
export function entityImageBaseId(kind: ImageEntityKind, entityId: string): string {
    return `${FOLDERS[kind]}/${entityId}`;
}

/**
 * Extrait le public_id d'une URL de livraison Cloudinary, ex.
 * `https://res.cloudinary.com/demo/image/upload/v1712/plats/abc-1712.jpg`
 * → `plats/abc-1712`. Renvoie null si l'URL n'est pas une image Cloudinary.
 */
export function publicIdFromCloudinaryUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    const marker = '/image/upload/';
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    const segments = parsed.pathname.slice(index + marker.length).split('/').filter(Boolean);
    // La version (v1712…) précède le public_id ; ce qui la précède éventuellement
    // est une transformation.
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const idSegments = versionIndex === -1 ? segments : segments.slice(versionIndex + 1);
    if (idSegments.length === 0) return null;
    const joined = decodeURIComponent(idSegments.join('/'));
    return joined.replace(/\.[a-z0-9]+$/i, '');
}

/**
 * Parmi des public_id trouvés par préfixe, garde uniquement les versions de
 * cette entité (`base` ou `base-<horodatage>`, jamais `base2…` d'une autre
 * entité) en excluant celle à conserver.
 */
export function selectEntityImagesToDelete(publicIds: string[], baseId: string, keepPublicId?: string | null): string[] {
    const isVersionOfEntity = (id: string) =>
        id === baseId || (id.startsWith(`${baseId}-`) && /^\d+$/.test(id.slice(baseId.length + 1)));
    return publicIds.filter((id) => id !== keepPublicId && isVersionOfEntity(id));
}
