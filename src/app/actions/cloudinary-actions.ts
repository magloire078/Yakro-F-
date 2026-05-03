'use server';

import { deleteImage } from '@/lib/cloudinary';

export async function deleteCloudinaryImageAction(publicId: string): Promise<boolean> {
    if (!publicId) return false;
    return deleteImage(publicId);
}
