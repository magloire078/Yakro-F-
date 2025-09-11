
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// In a real application, you would add server-side validation here to ensure
// that the currently logged-in user is a SuperAdmin before performing the update.
// For this prototype, we'll proceed with the update.

export async function updateUserAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required.');
  }
  
  const userDocRef = doc(db, 'utilisateurs', uid);
  
  try {
    await updateDoc(userDocRef, data);
    // Revalidate the admin page to show the updated data
    revalidatePath('/dashboard/admin');
  } catch (error) {
    console.error('Error updating user profile from server action:', error);
    throw new Error('Failed to update user profile.');
  }
}
