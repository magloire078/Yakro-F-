'use server';

import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import type { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function updateUserProfileAction(uid: string, data: Partial<UserProfile>) {
  const userDocRef = doc(db, 'utilisateurs', uid);
  try {
    await updateDoc(userDocRef, data);
    revalidatePath('/profile');
    if (data.rolesAutorises || data.roleSysteme) {
      revalidatePath('/dashboard/admin');
    }
  } catch (serverError: any) {
     if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        // We can't re-throw here in a server action, but we can log for debugging
        // On the client, this will be handled differently.
        console.error("Caught permission error in server action:", permissionError.message);
     }
     throw serverError; // Re-throw original error
  }
}
