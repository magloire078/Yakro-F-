
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// This is a simplified action. In a real-world scenario, you would have
// robust server-side authentication to verify if the caller has the
// permission to update the specified user's profile.
// For this prototype, we're assuming the check is implicitly handled
// by the UI (e.g., only showing the edit button for the logged-in user or an admin).

export async function updateUserAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required.');
  }

  // Warning: This action is simplified for the prototype.
  // A production app must have a secure way to verify the caller's identity and permissions.
  // For example, by verifying a Firebase ID token sent with the request.
  
  const userDocRef = doc(db, 'utilisateurs', uid);
  
  try {
    // Note: We're not preventing privilege escalation here.
    // A user could theoretically update their own roles.
    // This is a known limitation of this simplified prototype action.
    await updateDoc(userDocRef, data);

    // Revalidate paths to show the updated data
    revalidatePath('/dashboard/admin');
    revalidatePath('/profile');

  } catch (error) {
    console.error('Error updating user profile from server action:', error);
    throw new Error('Failed to update user profile.');
  }
}
