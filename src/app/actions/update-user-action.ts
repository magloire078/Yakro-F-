
'use server';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '../../../firebase-admin-init';

async function getUserIdFromSession(): Promise<string | null> {
    const sessionCookie = headers().get('__session')?.toString();
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
        return decodedClaims.uid;
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        return null;
    }
}


export async function updateUserAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required.');
  }

  const currentUserId = await getUserIdFromSession();
  
  if (!currentUserId) {
    throw new Error('Authentication required.');
  }

  let isSuperAdmin = false;
  try {
    const currentUserDoc = await getDoc(doc(db, 'utilisateurs', currentUserId));
    if (currentUserDoc.exists() && currentUserDoc.data().systemRole === 'SuperAdmin') {
        isSuperAdmin = true;
    }
  } catch(e) {
      // Ignore error if profile doc doesn't exist yet, they are not an admin.
  }

  // A user can update their own profile, OR a super admin can update any profile.
  if (currentUserId !== uid && !isSuperAdmin) {
      throw new Error('You do not have permission to perform this action.');
  }

  const userDocRef = doc(db, 'utilisateurs', uid);
  
  try {
    // Prevent non-admins from escalating privileges
    const sanitizedData = { ...data };
    if (!isSuperAdmin) {
        delete sanitizedData.role; // This field is deprecated, but good to keep for safety
        delete sanitizedData.allowedRoles;
        delete sanitizedData.systemRole;
    }
    
    await updateDoc(userDocRef, sanitizedData);

    // Revalidate paths to show the updated data
    revalidatePath('/dashboard/admin');
    revalidatePath('/profile');

  } catch (error) {
    console.error('Error updating user profile from server action:', error);
    throw new Error('Failed to update user profile.');
  }
}
