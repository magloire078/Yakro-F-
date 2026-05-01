
// Refactored for static export

import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { MenuItem } from '@/lib/types';
import { uploadImage, deleteImage } from '@/lib/cloudinary';


export async function addMenuItemAction(formData: FormData) {
    const itemJSON = formData.get('item') as string;
    const imageFile = formData.get('image') as File | null;
    const item = JSON.parse(itemJSON) as Omit<MenuItem, 'id'>;
    const collectionRef = collection(db!, "plats");
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
            await updateDoc(doc(db!, "plats", docRefId), { image: finalImageUrl });
        }

        // revalidatePath removed for static export

    } catch (e: unknown) {
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

    const itemDocRef = doc(db!, 'plats', itemId);
    try {
        const updateData: Partial<MenuItem> = { ...data };
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `plats/${itemId}`);
            updateData.image = imageUrl;
        }
        await updateDoc(itemDocRef, updateData);
        // revalidatePath removed for static export
    } catch (e: unknown) {
        console.error("Error updating menu item: ", e);
        throw e;
    }
}

export async function deleteMenuItemAction(itemId: string) {
    if (!itemId) {
        throw new Error("Item ID is required.");
    }
    const itemDocRef = doc(db!, 'plats', itemId);
    try {
        // Supprimer l'image de Cloudinary
        await deleteImage(`plats/${itemId}`);

        await deleteDoc(itemDocRef);
        // revalidatePath removed for static export
    } catch (e: unknown) {
        console.error("Error deleting menu item: ", e);
        throw e;
    }
}
