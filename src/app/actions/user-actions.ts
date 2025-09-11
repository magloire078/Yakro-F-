
'use server';

import { auth, firestore } from '../../../firebase-admin-init';
import { headers } from 'next/headers';
import type { UserProfile } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function verifySuperAdmin(): Promise<string> {
    const sessionCookie = headers().get('__session')?.toString();
    if (!sessionCookie) {
        throw new Error('Authentication required: No session cookie.');
    }
    try {
        const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
        const userDoc = await firestore().collection('utilisateurs').doc(decodedClaims.uid).get();
        if (!userDoc.exists || userDoc.data()?.systemRole !== 'SuperAdmin') {
            throw new Error('Authorization failed: Not a Super Admin.');
        }
        return decodedClaims.uid;
    } catch (error) {
        console.error("Error verifying Super Admin privileges:", error);
        throw new Error('Authentication or authorization failed.');
    }
}

export async function getAllUsersAction(): Promise<UserProfile[]> {
    await verifySuperAdmin();
    
    try {
        const usersSnapshot = await firestore().collection('utilisateurs').get();
        const users: UserProfile[] = [];
        usersSnapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        return users;
    } catch (error) {
        console.error('Error fetching all users from Firestore:', error);
        throw new Error('Failed to fetch users.');
    }
}

// Keep the update action if it's needed elsewhere or combine logic.
// For now, it's separate.
export async function updateUserAction(uid: string, data: Partial<UserProfile>) {
  if (!uid) {
    throw new Error('User ID is required.');
  }

  const sessionCookie = headers().get('__session')?.toString();
  if (!sessionCookie) {
    throw new Error('Authentication required.');
  }
  
  const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
  const currentUserId = decodedClaims.uid;

  let isSuperAdmin = false;
  try {
    const currentUserDoc = await firestore().collection('utilisateurs').doc(currentUserId).get();
    if (currentUserDoc.exists() && currentUserDoc.data()?.systemRole === 'SuperAdmin') {
        isSuperAdmin = true;
    }
  } catch(e) {
      // Ignore error if profile doc doesn't exist yet, they are not an admin.
  }

  // A user can update their own profile, OR a super admin can update any profile.
  if (currentUserId !== uid && !isSuperAdmin) {
      throw new Error('You do not have permission to perform this action.');
  }

  const userDocRef = firestore().collection('utilisateurs').doc(uid);
  
  try {
    // Prevent non-admins from escalating privileges
    const sanitizedData = { ...data };
    if (!isSuperAdmin) {
        delete sanitizedData.role;
        delete sanitizedData.allowedRoles;
        delete sanitizedData.systemRole;
    }
    
    await userDocRef.update(sanitizedData);

    // Revalidate paths to show the updated data
    revalidatePath('/dashboard/admin', 'layout');
    revalidatePath('/profile', 'page');

  } catch (error) {
    console.error('Error updating user profile from server action:', error);
    throw new Error('Failed to update user profile.');
  }
}
