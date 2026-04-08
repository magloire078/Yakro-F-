
// Refactored for static export

import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Restaurant } from '@/lib/types';

const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing in environment variables (.env.local)");
    }

    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    // On utilise le chemin fourni (ex: restaurants/123) comme public_id
    formData.append('public_id', path);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
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

        // revalidatePath removed for static export

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

        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error updating restaurant: ", e);
        throw e;
    }
}
