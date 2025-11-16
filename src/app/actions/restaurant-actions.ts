
'use server';

import { collection, addDoc, updateDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
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
        const snapshot = await uploadBytes(storageRef, fileOrDataUrl);
        downloadURL = await getDownloadURL(snapshot.ref);
    }
    
    return downloadURL;
};


export async function addRestaurantAction(formData: FormData) {
    const dataJSON = formData.get('data') as string;
    const imageFile = formData.get('image') as File | null;
    const data = JSON.parse(dataJSON) as Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'> & { proprietaireId: string };
    const docRef = doc(collection(db, "restaurants"));
    const restaurantId = docRef.id;

    if (!data.proprietaireId) {
        throw new Error("Owner ID is missing.");
    }
    
    const restaurantPayload: Omit<Restaurant, 'id'> = {
        ...data,
        note: 0,
        enVedette: false,
        indiceImage: data.cuisine ? `${data.cuisine} restaurant` : 'restaurant food',
        latitude: data.latitude || 6.82,
        longitude: data.longitude || -5.28,
        image: "" // Start with empty image URL
    };
    
    try {
        // 1. Create document without image to get ID
        await setDoc(docRef, restaurantPayload);
        
        // 2. Determine image URL
        let finalImageUrl: string | undefined = undefined;

        if (imageFile) {
             finalImageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
        } 
        else {
            try {
                const imagePrompt = `restaurant de cuisine ${data.cuisine}, photorealistic, professional food photography`;
                const generatedImage = await generateImage({ prompt: imagePrompt });
                if (generatedImage.imageDataUri) {
                    finalImageUrl = await uploadImage(generatedImage.imageDataUri, `restaurants/${restaurantId}`);
                }
            } catch (aiError) {
                console.error("AI image generation for restaurant failed:", aiError);
                // Continue without an image if AI fails
            }
        }
        
        // 3. Update document with final image URL if it exists
        if (finalImageUrl) {
            await updateDoc(docRef, { image: finalImageUrl });
        }
        
        revalidatePath('/');
        revalidatePath('/dashboard/new-restaurant');
        revalidatePath('/dashboard/my-restaurants');

    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: restaurantPayload,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e; // Re-throw original error to be caught by Next.js action boundary
    }
}

export async function updateRestaurantAction(formData: FormData) {
    const restaurantId = formData.get('restaurantId') as string;
    const dataJSON = formData.get('data') as string;
    const imageFile = formData.get('image') as File | null;
    const data = JSON.parse(dataJSON) as Partial<Restaurant>;

    if (!restaurantId) {
        throw new Error("Restaurant ID is required.");
    }
    
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    
    try {
        const updateData: Partial<Restaurant> = { ...data };
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
            updateData.image = imageUrl;
        }

        await updateDoc(restaurantDocRef, updateData);
        
        revalidatePath('/');
        revalidatePath(`/restaurants/${restaurantId}`);
        revalidatePath('/dashboard/my-restaurants');
        revalidatePath(`/dashboard/my-restaurants/${restaurantId}/edit`);
        revalidatePath('/dashboard/boost');
    } catch (e: any) {
         const permissionError = new FirestorePermissionError({
            path: restaurantDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e; // Re-throw original error to be caught by Next.js action boundary
    }
}
