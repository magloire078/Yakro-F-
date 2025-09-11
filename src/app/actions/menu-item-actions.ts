
'use server';

import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { MenuItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper function for uploading images
const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

export async function addMenuItemAction(formData: FormData) {
    const itemJSON = formData.get('item') as string;
    const imageFile = formData.get('image') as File | null;
    const item = JSON.parse(itemJSON) as Omit<MenuItem, 'id'>;

    try {
        const docRef = await addDoc(collection(db, "plats"), item);
        const itemId = docRef.id;

        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `plats/${itemId}`);
            await updateDoc(doc(db, "plats", itemId), { image: imageUrl });
        }
        revalidatePath('/dashboard/menu');
    } catch (e) {
        console.error("Error adding menu item: ", e);
        throw new Error("Failed to add menu item.");
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
        revalidatePath('/dashboard/menu');
        revalidatePath(`/restaurants/${data.restaurantId}`);
    } catch (e) {
        console.error("Error updating menu item: ", e);
        throw new Error("Failed to update menu item.");
    }
}

export async function deleteMenuItemAction(itemId: string) {
     if (!itemId) {
        throw new Error("Item ID is required.");
    }
    const itemDocRef = doc(db, 'plats', itemId);
    try {
      // TODO: Delete image from storage as well
      await deleteDoc(itemDocRef);
      revalidatePath('/dashboard/menu');
    } catch (e) {
      console.error("Error deleting menu item: ", e);
      throw new Error("Failed to delete menu item.");
    }
}
