
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
    const data = JSON.parse(dataJSON) as Omit<Restaurant, 'id'>;

    try {
        const restaurantData: Omit<Restaurant, 'id' | 'image'> = {
            ...data,
            note: 0,
            indiceImage: `${data.cuisine} restaurant`,
        };

        const docRef = await addDoc(collection(db, "restaurants"), restaurantData);
        const restaurantId = docRef.id;

        let imageUrl = `https://placehold.co/600x400.png`;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
        }

        await updateDoc(docRef, { image: imageUrl });

        revalidatePath('/');
        revalidatePath('/dashboard/new-restaurant');
        revalidatePath('/dashboard/my-restaurants');
    } catch (e) {
        console.error("Error adding restaurant: ", e);
        throw new Error("Failed to add restaurant.");
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
    } catch (e) {
        console.error("Error updating restaurant: ", e);
        throw new Error("Failed to update restaurant.");
    }
}
