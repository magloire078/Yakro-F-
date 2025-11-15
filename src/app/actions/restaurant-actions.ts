

'use server';

import { collection, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


// Helper function for uploading images
const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
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
    
    const restaurantPayload = {
        ...data,
        note: 0,
        enVedette: false,
        indiceImage: `${data.cuisine} restaurant`,
        latitude: data.latitude || 6.82,
        longitude: data.longitude || -5.28,
        image: "" // Start with empty image URL
    };
    
    try {
        const batch = writeBatch(db);
        let imageUrl = '';

        if (imageFile) {
            imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
        }
        
        batch.set(docRef, { ...restaurantPayload, image: imageUrl });
        await batch.commit();
        
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
        console.error("Original error in addRestaurantAction: ", e);
        throw e;
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
        console.error("Original error in updateRestaurantAction: ", e);
        throw e;
    }
}


