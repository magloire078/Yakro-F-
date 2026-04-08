// Refactored for static export

import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { UserProfile, AppRole } from '@/lib/types';

type SetupInitialUserParams = {
    uid: string;
    email: string;
    nom?: string | null;
    telephone?: string;
    role: AppRole;
}

export async function setupInitialUserAction(userData: SetupInitialUserParams) {
    const userDocRef = doc(db, 'utilisateurs', userData.uid);

    try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            const newUserProfile: Omit<UserProfile, 'uid'> & { uid: string } = {
                uid: userData.uid,
                email: userData.email,
                nom: userData.nom || userData.email.split('@')[0] || 'Nouvel utilisateur',
                dateCreation: serverTimestamp(),
                role: userData.role || 'client',
                roleSysteme: 'User',
                ...(userData.telephone && { telephone: userData.telephone }),
            };

            await setDoc(userDocRef, newUserProfile);
        }
    } catch (e: any) {
        console.error("Error setting up initial user: ", e);
        throw e;
    }
}


export async function updateUserProfileAction(uid: string, data: Partial<UserProfile>) {
    if (!uid) {
        throw new Error('User ID is required to update a profile.');
    }
    const userDocRef = doc(db, 'utilisateurs', uid);

    try {
        await updateDoc(userDocRef, data);
        // revalidatePath removed for static export
    } catch (e: any) {
        console.error("Error updating user profile: ", e);
        throw e;
    }
}
