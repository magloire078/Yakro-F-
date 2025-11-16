
'use server';

import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { UserProfile } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { revalidatePath } from 'next/cache';

type SetupInitialUserParams = {
    uid: string;
    email: string;
    nom?: string | null;
    telephone?: string;
}

export async function setupInitialUserAction(userData: SetupInitialUserParams) {
    const userDocRef = doc(db, 'utilisateurs', userData.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUserProfile: Omit<UserProfile, 'uid'> & {uid: string} = {
            uid: userData.uid,
            email: userData.email,
            nom: userData.nom || userData.email.split('@')[0] || 'Nouvel utilisateur',
            dateCreation: serverTimestamp(),
            role: 'client',
            roleSysteme: 'User',
            ...(userData.telephone && { telephone: userData.telephone }),
        };
        
        // This setDoc is expected to succeed based on security rules (allow create if isUser(userId))
        // So we don't add the complex error handling here for now.
        await setDoc(userDocRef, newUserProfile);
    }
}


export async function updateUserProfileAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required to update a profile.');
  }
  const userDocRef = doc(db, 'utilisateurs', uid);

  // Use .catch() to handle potential permission errors without crashing the server action
  return updateDoc(userDocRef, data)
    .then(() => {
        revalidatePath('/profile');
        revalidatePath('/profile/edit');
        revalidatePath('/dashboard/admin');
    })
    .catch((e) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        // We still need to throw an error to let the client-side form know the submission failed.
        throw new Error(`Failed to update profile: ${permissionError.message}`);
    });
}
