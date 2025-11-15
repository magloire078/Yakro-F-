
'use server';

import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import type { MenuItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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
    const docRef = doc(collectionRef); // generate an ID upfront
    const docRefId = docRef.id;

    try {
        let finalImageUrl: string | undefined = undefined;

        // If user provides an image, use it.
        if (imageFile) {
             finalImageUrl = await uploadImage(imageFile, `plats/${docRefId}`);
        } 
        // If no user image, and there's a hint, generate one with AI
        else if (item.indiceImage) {
            try {
                const generatedImage = await generateImage({ prompt: item.indiceImage });
                if (generatedImage.imageDataUri) {
                    finalImageUrl = await uploadImage(generatedImage.imageDataUri, `plats/${docRefId}`);
                }
            } catch (aiError) {
                console.error("AI image generation failed:", aiError);
                // Continue without an image if AI fails
            }
        }
        
        const newMenuItemData = { ...item, image: finalImageUrl || '' };
        await setDoc(docRef, newMenuItemData);
        
        revalidatePath('/dashboard/menu');
        revalidatePath(`/restaurants/${item.restaurantId}`);

    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: item,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error adding menu item: ", e);
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
        if (data.restaurantId) {
          revalidatePath(`/restaurants/${data.restaurantId}`);
        }
    } catch (e) {
         const permissionError = new FirestorePermissionError({
            path: itemDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error updating menu item: ", e);
        throw new Error("Failed to update menu item.");
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
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: itemDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error deleting menu item: ", e);
        throw new Error("Failed to delete menu item.");
    }
}
