
/**
 * Utility for uploading images to Cloudinary from server actions or AI flows.
 */

/**
 * Échec d'envoi d'une photo, avec un message destiné à l'utilisateur
 * (les détails techniques restent dans la console).
 */
export class ImageUploadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ImageUploadError';
    }
}

export const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === "" || uploadPreset === "" || cloudName.includes('your_') || uploadPreset.includes('your_')) {
        const missing = [];
        if (!cloudName || cloudName.includes('your_')) missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        if (!uploadPreset || uploadPreset.includes('your_')) missing.push('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
        
        console.error(`Configuration Cloudinary manquante : ${missing.join(', ')}`);
        throw new ImageUploadError("L'envoi de photos n'est pas configuré sur ce serveur. Contactez le support.");
    }

    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    
    // Identifiant UNIQUE à chaque envoi (ex. 'plats/abc-1760270000000').
    // Un envoi « unsigned » ne peut jamais écraser une image existante :
    // avec un identifiant fixe ('plats/abc'), Cloudinary renvoyait l'ancienne
    // photo au lieu d'enregistrer la nouvelle, et la modification d'une photo
    // semblait ne jamais prendre effet.
    if (path) {
        formData.append('public_id', `${path}-${Date.now()}`);
    }

    let response: Response;
    try {
        response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Error in uploadImage:', error);
        throw new ImageUploadError("Connexion interrompue pendant l'envoi de la photo. Vérifiez votre réseau et réessayez.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.secure_url) {
        console.error('Cloudinary upload error:', response.status, data);
        throw new ImageUploadError(
            "La photo n'a pas pu être envoyée. Utilisez une image JPG, PNG ou WEBP de moins de 10 Mo, puis réessayez.",
        );
    }

    return data.secure_url;
};

/**
 * Utility for deleting images from Cloudinary (Secure, server-side only).
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || apiSecret === "" || apiSecret.includes('your_')) {
        console.warn("Cloudinary deletion skipped: Missing configuration (CLOUDINARY_API_SECRET).");
        return false;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature
    // The signature for 'destroy' is sha1 of: "public_id=<public_id>&timestamp=<timestamp><api_secret>"
    const signatureSource = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    try {
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(signatureSource).digest('hex');

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.result !== 'ok') {
            console.error('Cloudinary delete error:', data);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteImage:', error);
        return false;
    }
};
