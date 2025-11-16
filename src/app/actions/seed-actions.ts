
'use server';

import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export async function seedDatabaseAction(userId: string) {
    const restaurantsRef = collection(db, 'restaurants');
    const restaurantsSnap = await getDocs(restaurantsRef);

    // Only seed if the database is empty
    if (restaurantsSnap.empty && userId) {
        const batch = writeBatch(db);

        // 1. Seed Restaurants
        const restaurantDocs = initialRestaurants.map((resto) => {
             const docRef = doc(collection(db, 'restaurants'));
             const newResto: Omit<Restaurant, 'id'> = {
                ...resto,
                proprietaireId: userId, // Assign to the current user
             };
             batch.set(docRef, newResto);
             return { id: docRef.id, ...newResto };
        });

        // 2. Seed Menu Items and assign them to the newly created restaurants
        const itemsPerRestaurant = Math.ceil(initialMenuItems.length / restaurantDocs.length);

        initialMenuItems.forEach((item, index) => {
            const restaurantIndex = Math.floor(index / itemsPerRestaurant);
            const assignedRestaurant = restaurantDocs[restaurantIndex];

            if (assignedRestaurant) {
                const itemDocRef = doc(collection(db, 'plats'));
                const placeholder = getPlaceholderImage(item.indiceImage);
                batch.set(itemDocRef, {
                    ...item,
                    restaurantId: assignedRestaurant.id,
                    image: placeholder.url
                });
            }
        });

        try {
            await batch.commit();
            console.log('Database seeded successfully!');
            // Revalidate all paths to reflect the new data
            revalidatePath('/', 'layout');
            return { success: true, message: 'Database seeded successfully.' };
        } catch (error) {
            console.error("Error seeding database: ", error);
            const permissionError = new FirestorePermissionError({
                path: `(batch write)`,
                operation: 'create',
                requestResourceData: { 
                    message: "Batch write for initial database seed.",
                    itemCount: initialRestaurants.length + initialMenuItems.length 
                },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError; // Re-throw so the client knows it failed
        }
    }
    return { success: false, message: 'Database is not empty, seeding skipped.'};
}
