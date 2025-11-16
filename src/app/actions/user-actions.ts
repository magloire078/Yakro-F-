
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
    
    try {
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
            
            await setDoc(userDocRef, newUserProfile);
        }
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error setting up initial user: ", e);
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
      revalidatePath('/profile');
      revalidatePath('/profile/edit');
      revalidatePath('/dashboard/admin');
  } catch (e: any) {
       const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Original error updating user profile: ", e);
        throw e;
  }
}
