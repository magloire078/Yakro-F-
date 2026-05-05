
/**
 * Utility for uploading images to Cloudinary from server actions or AI flows.
 */

export const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === "" || uploadPreset === "" || cloudName.includes('your_') || uploadPreset.includes('your_')) {
        const missing = [];
        if (!cloudName || cloudName.includes('your_')) missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        if (!uploadPreset || uploadPreset.includes('your_')) missing.push('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
        
        throw new Error(`Configuration Cloudinary manquante ou non valide dans le fichier .env. Veuillez renseigner : ${missing.join(', ')}`);
    }

    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    
    // Use the provided path as public_id (e.g. 'restaurants/123' or 'ia-generated/dish_123')
    if (path) {
        formData.append('public_id', path);
    }

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cloudinary upload error:', data);
            throw new Error(`Cloudinary Error (${response.status}): ${data.error?.message || JSON.stringify(data) || response.statusText}`);
        }

        return data.secure_url;
    } catch (error) {
        console.error('Error in uploadImage:', error);
        throw error;
    }
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

        // console.log(`Cloudinary image deleted: ${publicId}`);
        return true;
    } catch (error) {
        console.error('Error in deleteImage:', error);
        return false;
    }
};
