import 'server-only';

// API d'administration Cloudinary (authentifiée par la clé secrète) : ne
// doit jamais être importée côté navigateur.

function adminConfig() {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret || apiSecret.includes('your_')) return null;
    return {
        baseUrl: `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`,
        authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    };
}

/** public_id des images dont l'identifiant commence par `prefix` (au plus 500). */
export async function listImagePublicIds(prefix: string): Promise<string[]> {
    const config = adminConfig();
    if (!config) {
        console.error('Cloudinary admin: configuration incomplète (CLOUDINARY_API_SECRET).');
        return [];
    }
    const url = `${config.baseUrl}?prefix=${encodeURIComponent(prefix)}&max_results=500`;
    const response = await fetch(url, { headers: { Authorization: config.authorization }, cache: 'no-store' });
    if (!response.ok) {
        console.error('Cloudinary admin: liste impossible', response.status, await response.text().catch(() => ''));
        return [];
    }
    const data = (await response.json()) as { resources?: Array<{ public_id: string }> };
    return (data.resources ?? []).map((resource) => resource.public_id);
}

/** Supprime les images données ; renvoie le nombre d'images effectivement supprimées. */
export async function deleteImagesByPublicIds(publicIds: string[]): Promise<number> {
    const config = adminConfig();
    if (!config || publicIds.length === 0) return 0;
    let deleted = 0;
    // L'API accepte au plus 100 identifiants par appel.
    for (let i = 0; i < publicIds.length; i += 100) {
        const batch = publicIds.slice(i, i + 100);
        const query = batch.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
        const response = await fetch(`${config.baseUrl}?${query}`, {
            method: 'DELETE',
            headers: { Authorization: config.authorization },
        });
        if (!response.ok) {
            console.error('Cloudinary admin: suppression impossible', response.status, await response.text().catch(() => ''));
            continue;
        }
        const data = (await response.json()) as { deleted?: Record<string, string> };
        deleted += Object.values(data.deleted ?? {}).filter((status) => status === 'deleted').length;
    }
    return deleted;
}
