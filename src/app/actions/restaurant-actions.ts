
'use server';

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function addRestaurantAction(restaurant: Omit<Restaurant, 'id'>) {
    try {
        await addDoc(collection(db, "restaurants"), restaurant);
        revalidatePath('/');
        revalidatePath('/dashboard/new-restaurant');
    } catch (e) {
        console.error("Error adding restaurant: ", e);
        throw new Error("Failed to add restaurant.");
    }
}

export async function updateRestaurant(restaurantId: string, data: Partial<Restaurant>) {
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    try {
        await updateDoc(restaurantDocRef, data);
        revalidatePath('/');
        revalidatePath(`/restaurants/${restaurantId}`);
        revalidatePath('/dashboard/boost');
    } catch (e) {
        console.error("Error updating restaurant: ", e);
        throw new Error("Failed to update restaurant.");
    }
}
