
'use server';

import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { MenuItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { generateImage } from '@/ai/flows/generate-image-flow';

// Helper function for uploading images
const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    let downloadURL: string;

    if (typeof fileOrDataUrl === 'string') {
        // It's a data URL from AI generation
        const snapshot = await uploadString(storageRef, fileOrDataUrl, 'data_url');
        downloadURL = await getDownloadURL(snapshot.ref);
    } else {
        // It's a File object from user upload
        // To upload a file, you need its buffer. Convert file to ArrayBuffer
        const arrayBuffer = await fileOrDataUrl.arrayBuffer();
        const snapshot = await uploadString(storageRef, arrayBuffer as any, 'data_url');
        downloadURL = await getDownloadURL(snapshot.ref);
    }
    
    return downloadURL;
};

export async function addMenuItemAction(formData: FormData) {
    const itemJSON = formData.get('item') as string;
    const imageFile = formData.get('image') as File | null;
    const item = JSON.parse(itemJSON) as Omit<MenuItem, 'id'>;

    try {
        let imageUrl: string | undefined = undefined;

        // If no image is provided by user, generate one with AI
        if (!imageFile && item.indiceImage) {
            try {
                const generatedImage = await generateImage({ prompt: item.indiceImage });
                if (generatedImage.imageDataUri) {
                    imageUrl = generatedImage.imageDataUri;
                }
            } catch (aiError) {
                console.error("AI image generation failed:", aiError);
                // Continue without an image if AI fails
            }
        }
        
        // Add the base item data to Firestore first to get an ID
        const itemData: Omit<MenuItem, 'id' | 'image'> = { ...item };
        const docRef = await addDoc(collection(db, "plats"), itemData);
        const itemId = docRef.id;

        // Now, handle the image upload (either from user or AI)
        const imageToUpload = imageFile || imageUrl;
        if (imageToUpload) {
            const finalImageUrl = await uploadImage(imageToUpload, `plats/${itemId}`);
            await updateDoc(doc(db, "plats", itemId), { image: finalImageUrl });
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
