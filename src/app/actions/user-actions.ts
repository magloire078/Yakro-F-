
'use server';

import { firestore } from '@/lib/firebase-server';
import { collection, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

/**
 * Server action to get all users from the Firestore 'utilisateurs' collection.
 * Warning: This action is currently not protected and can be executed by any authenticated user.
 * In a production environment, you must add server-side authentication and authorization
 * to ensure only administrators can call this function.
 */
export async function getAllUsersAction(): Promise<UserProfile[]> {
    try {
        // In a real app, you would verify the caller's admin status here.
        // For example, by checking their custom claims from a Firebase ID token.
        
        const usersCollectionRef = collection(firestore, 'utilisateurs');
        const usersSnapshot = await getDocs(usersCollectionRef);

        const usersList: UserProfile[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                email: data.email || 'N/A',
                dateCreation: data.dateCreation,
                nom: data.nom || 'Non défini',
                telephone: data.telephone,
                adresseParDefaut: data.adresseParDefaut,
                role: data.role,
                roleSysteme: data.roleSysteme || 'User',
                rolesAutorises: data.rolesAutorises || ['client'],
            };
        });

        return usersList;

    } catch (error) {
        console.error("Error in getAllUsersAction:", error);
        // This will likely be a permissions issue if Firestore rules are restrictive.
        // The simplified approach for the prototype is to have open read access
        // on the `utilisateurs` collection and protect this action on the server.
        // Since we removed the server-side auth check, this will fail if rules are strict.
        return [];
    }
}
