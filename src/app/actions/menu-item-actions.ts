'use server';

import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { db, storage } from '@/firebase/client';
import type { MenuItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { generateImage } from '@/ai/flows/generate-image-flow';

const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    let downloadURL: string;

    if (typeof fileOrDataUrl === 'string') {
        const snapshot = await uploadString(storageRef, fileOrDataUrl, 'data_url');
        downloadURL = await getDownloadURL(snapshot.ref);
    } else {
        const snapshot = await uploadBytes(storageRef, fileOrDataUrl);
        downloadURL = await getDownloadURL(snapshot.ref);
    }
    
    return downloadURL;
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
        else if (item.indiceImage) {
            try {
                const generatedImage = await generateImage({ prompt: item.indiceImage });
                if (generatedImage.imageDataUri) {
                    finalImageUrl = await uploadImage(generatedImage.imageDataUri, `plats/${docRefId}`);
                }
            } catch (aiError) {
                console.error("AI image generation failed:", aiError);
            }
        }
        
        if (finalImageUrl) {
            await updateDoc(doc(db, "plats", docRefId), { image: finalImageUrl });
        }
        
        revalidatePath('/dashboard/menu');
        revalidatePath(`/restaurants/${item.restaurantId}`);

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
        revalidatePath('/dashboard/menu');
        if (data.restaurantId) {
          revalidatePath(`/restaurants/${data.restaurantId}`);
        }
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
      const imageRef = ref(storage, `plats/${itemId}`);
      try {
        await deleteObject(imageRef);
      } catch (error: any) {
         if (error.code !== 'storage/object-not-found') {
            console.warn("Could not delete image from storage:", error);
         }
      }
      await deleteDoc(itemDocRef);
      revalidatePath('/dashboard/menu');
    } catch (e: any) {
        console.error("Error deleting menu item: ", e);
        throw e;
    }
}
