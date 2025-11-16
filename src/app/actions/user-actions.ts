
'use server';

import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
        
        setDoc(userDocRef, newUserProfile).catch(e => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw e; // Re-throw
        });
    }
}


export async function updateUserProfileAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required to update a profile.');
  }
  const userDocRef = doc(db, 'utilisateurs', uid);

  updateDoc(userDocRef, data)
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
        throw e; // Re-throw
    });
}
