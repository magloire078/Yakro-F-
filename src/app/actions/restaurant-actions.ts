
// Refactored for static export

import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Restaurant } from '@/lib/types';
import { uploadImage, deleteImage } from '@/lib/cloudinary';


export async function addRestaurantAction(formData: FormData) {
    const dataJSON = formData.get('data') as string;
    const imageFile = formData.get('image') as File | null;
    const data = JSON.parse(dataJSON) as Omit<Restaurant, 'id' | 'image' | 'note' | 'enVedette'> & { proprietaireId: string };

    const docRef = doc(collection(db!, "restaurants"));
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

    } catch (e: unknown) {
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

    const restaurantDocRef = doc(db!, 'restaurants', restaurantId);

    try {
        const updateData: Partial<Restaurant> = { ...data };
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
            updateData.image = imageUrl;
        }

        await updateDoc(restaurantDocRef, updateData);

        // revalidatePath removed for static export
    } catch (e: unknown) {
        console.error("Error updating restaurant: ", e);
        throw e;
    }
}

export async function deleteRestaurantAction(restaurantId: string) {
    if (!restaurantId) {
        throw new Error("Restaurant ID is required.");
    }

    try {
        // 1. Delete associated Menu Items (plats) and their images
        const platsQuery = query(collection(db!, 'plats'), where('restaurantId', '==', restaurantId));
        const platsSnapshot = await getDocs(platsQuery);
        
        for (const platDoc of platsSnapshot.docs) {
            // Delete plat image from Cloudinary
            await deleteImage(`plats/${platDoc.id}`);
            // Delete plat document
            await deleteDoc(platDoc.ref);
        }

        // 2. Delete associated Reviews (avis)
        const avisQuery = query(collection(db!, 'avis'), where('restaurantId', '==', restaurantId));
        const avisSnapshot = await getDocs(avisQuery);
        for (const avisDoc of avisSnapshot.docs) {
            await deleteDoc(avisDoc.ref);
        }

        // 3. Delete associated Stock items
        const stocksQuery = query(collection(db!, 'stocks'), where('restaurantId', '==', restaurantId));
        const stocksSnapshot = await getDocs(stocksQuery);
        for (const stockDoc of stocksSnapshot.docs) {
            await deleteDoc(stockDoc.ref);
        }

        // 4. Delete restaurant image from Cloudinary
        await deleteImage(`restaurants/${restaurantId}`);

        // 5. Delete the restaurant itself
        await deleteDoc(doc(db!, 'restaurants', restaurantId));

    } catch (e: unknown) {
        console.error("Error deleting restaurant: ", e);
        throw e;
    }
}
