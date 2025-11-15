
'use server';

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';


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
    const data = JSON.parse(dataJSON) as Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'>;

    if (!data.proprietaireId) {
        throw new Error("Owner ID is missing.");
    }
    
    let docRef;
    try {
        // First, add the restaurant document with an empty image URL to get an ID.
        docRef = await addDoc(collection(db, "restaurants"), {
            ...data,
            note: 0,
            enVedette: false,
            indiceImage: `${data.cuisine} restaurant`,
            latitude: data.latitude || 6.82,
            longitude: data.longitude || -5.28,
            image: "" // Start with empty image URL
        });
        const restaurantId = docRef.id;

        // If an image file was provided, upload it now.
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
            // Now, update the document with the correct image URL.
            await updateDoc(docRef, { image: imageUrl });
        }


        revalidatePath('/');
        revalidatePath('/dashboard/new-restaurant');
        revalidatePath('/dashboard/my-restaurants');
    } catch (e: any) {
        console.error("Error adding restaurant: ", e);
        // This makes sure the permission error can be caught by the client
        throw new Error(e.message || "Failed to add restaurant.");
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
    } catch (e: any) {
        console.error("Error updating restaurant: ", e);
        throw new Error(e.message || "Failed to update restaurant.");
    }
}
