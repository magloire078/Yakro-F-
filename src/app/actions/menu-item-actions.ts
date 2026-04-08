
// Refactored for static export

import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { MenuItem } from '@/lib/types';

const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing.");
    }

    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', path);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
};

export async function addMenuItemAction(formData: FormData) {
    const itemJSON = formData.get('item') as string;
    const imageFile = formData.get('image') as File | null;
    const item = JSON.parse(itemJSON) as Omit<MenuItem, 'id'>;
    const collectionRef = collection(db, "plats");
    let docRefId: string | null = null;
    let finalImageUrl: string | undefined = undefined;

    try {
        const newMenuItemData = { ...item, image: '' };
        const docRef = await addDoc(collectionRef, newMenuItemData);
        docRefId = docRef.id;

        if (imageFile) {
            finalImageUrl = await uploadImage(imageFile, `plats/${docRefId}`);
        }

        if (finalImageUrl) {
            await updateDoc(doc(db, "plats", docRefId), { image: finalImageUrl });
        }

        // revalidatePath removed for static export

    } catch (e: any) {
        console.error("Error adding menu item: ", e);
        throw e;
    }
}

export async function updateMenuItemAction(formData: FormData) {
    const itemId = formData.get('itemId') as string;
    const dataJSON = formData.get('data') as string;
    const imageFile = formData.get('image') as File | null;
    const data = JSON.parse(dataJSON) as Partial<MenuItem>;

    if (!itemId) {
        throw new Error("Item ID is required.");
    }

    const itemDocRef = doc(db, 'plats', itemId);
    try {
        const updateData: Partial<MenuItem> = { ...data };
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `plats/${itemId}`);
            updateData.image = imageUrl;
        }
        await updateDoc(itemDocRef, updateData);
        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error updating menu item: ", e);
        throw e;
    }
}

export async function deleteMenuItemAction(itemId: string) {
    if (!itemId) {
        throw new Error("Item ID is required.");
    }
    const itemDocRef = doc(db, 'plats', itemId);
    try {
        // Pour supprimer l'image sur Cloudinary via l'API client de façon sécurisée,
        // il faudrait passer par une fonction serveur. Deleting est commenté pour l'instant.
        // TODO: Implémenter la suppression d'image Cloudinary (require API Secret)
        await deleteDoc(itemDocRef);
        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error deleting menu item: ", e);
        throw e;
    }
}
