'use server';

import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { initialRestaurants, initialMenuItems } from '@/lib/data';
import type { Restaurant } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export async function seedDatabaseAction(userId: string) {
    if (!userId) {
        throw new Error("User ID is required to seed the database.");
    }

    const restaurantsRef = collection(db, 'restaurants');
    
    try {
        const restaurantsSnap = await getDocs(restaurantsRef);

        if (restaurantsSnap.empty) {
            const batch = writeBatch(db);

            const restaurantDocs = initialRestaurants.map((resto) => {
                 const docRef = doc(collection(db, 'restaurants'));
                 const newResto: Omit<Restaurant, 'id'> = {
                    ...resto,
                    proprietaireId: userId,
                 };
                 batch.set(docRef, newResto);
                 return { id: docRef.id, ...newResto };
            });

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

            await batch.commit();
            revalidatePath('/', 'layout');
            return { success: true, message: 'Database seeded successfully.' };

        } else {
             return { success: false, message: 'Database is not empty, seeding skipped.'};
        }
    } catch (e: any) {
        console.error("Error seeding database: ", e);
        throw e;
    }
}
