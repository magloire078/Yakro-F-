
'use server';

import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage } from '@/firebase/client';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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
        indiceImage: data.indiceImage || (data.cuisine ? `${data.cuisine} restaurant` : 'restaurant food'),
        latitude: data.latitude || 6.82,
        longitude: data.longitude || -5.28,
        image: "" 
    };
    
    try {
        await setDoc(docRef, restaurantPayload);
        
        let finalImageUrl: string | undefined = undefined;

        if (imageFile) {
             finalImageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
        } 
        
        if (finalImageUrl) {
            await updateDoc(docRef, { image: finalImageUrl });
        }
        
        revalidatePath('/', 'layout');

    } catch (e: any) {
        console.error("Error adding restaurant: ", e);
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
        
        revalidatePath('/', 'layout');
        revalidatePath(`/restaurants/${restaurantId}`);
        revalidatePath(`/dashboard/my-restaurants/${restaurantId}/edit`);
    } catch (e: any) {
        console.error("Error updating restaurant: ", e);
        throw e;
    }
}
