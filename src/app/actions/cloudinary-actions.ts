'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { deleteImagesByPublicIds, listImagePublicIds } from '@/lib/cloudinary-admin';
import {
    entityImageBaseId,
    isSafeEntityId,
    publicIdFromCloudinaryUrl,
    selectEntityImagesToDelete,
    type ImageEntityKind,
} from '@/lib/cloudinary-ids';

export interface DeleteEntityImagesInput {
    idToken: string;
    kind: ImageEntityKind;
    entityId: string;
    /** Photo à conserver (après un changement de photo) ; absente = tout supprimer. */
    keepImageUrl?: string | null;
}

export type DeleteEntityImagesResult = { success: true; deleted: number } | { success: false; error: string };

/**
 * Supprime de Cloudinary les photos d'un plat ou d'un restaurant.
 *
 * Une action serveur est un point d'accès public : l'appelant est donc
 * authentifié (jeton Firebase) et doit être propriétaire du restaurant
 * concerné, ou SuperAdmin. L'ancienne action acceptait n'importe quel
 * identifiant d'image sans aucune vérification.
 *
 * À appeler AVANT de supprimer le document Firestore (la propriété est
 * vérifiée sur le document), ou après un changement de photo avec
 * `keepImageUrl` pour effacer les versions précédentes.
 */
export async function deleteEntityImagesAction(input: DeleteEntityImagesInput): Promise<DeleteEntityImagesResult> {
    const { idToken, kind, entityId, keepImageUrl } = input;
    if (!idToken || (kind !== 'plat' && kind !== 'restaurant') || !isSafeEntityId(entityId)) {
        return { success: false, error: 'Paramètres invalides.' };
    }

    let uid: string;
    try {
        uid = (await getAdminAuth().verifyIdToken(idToken)).uid;
    } catch {
        return { success: false, error: 'Authentification invalide.' };
    }

    const db = getAdminDb();
    const callerSnap = await db.collection('utilisateurs').doc(uid).get();
    const isSuperAdmin = callerSnap.exists && callerSnap.data()?.roleSysteme === 'SuperAdmin';

    const entitySnap = await db.collection(kind === 'plat' ? 'plats' : 'restaurants').doc(entityId).get();
    if (!entitySnap.exists) {
        return { success: false, error: 'Élément introuvable.' };
    }

    if (!isSuperAdmin) {
        const restaurantId = kind === 'plat' ? entitySnap.data()?.restaurantId : entityId;
        const restaurantSnap = typeof restaurantId === 'string' && restaurantId
            ? await db.collection('restaurants').doc(restaurantId).get()
            : null;
        if (restaurantSnap?.data()?.proprietaireId !== uid) {
            return { success: false, error: 'Accès refusé.' };
        }
    }

    const baseId = entityImageBaseId(kind, entityId);
    const candidates = await listImagePublicIds(baseId);
    const toDelete = selectEntityImagesToDelete(candidates, baseId, publicIdFromCloudinaryUrl(keepImageUrl));
    const deleted = await deleteImagesByPublicIds(toDelete);
    return { success: true, deleted };
}
