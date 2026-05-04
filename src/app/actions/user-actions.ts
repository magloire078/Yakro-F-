// Client-side helper for /utilisateurs mutations. Runs in the browser via
// the Firebase client SDK, gated by the security rules.

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { UserProfile } from '@/lib/types';

export async function updateUserProfileAction(uid: string, data: Partial<UserProfile>) {
    if (!uid) {
        throw new Error('User ID is required to update a profile.');
    }
    const userDocRef = doc(db!, 'utilisateurs', uid);

    try {
        await updateDoc(userDocRef, data);
    } catch (e: unknown) {
        console.error("Error updating user profile: ", e);
        throw e;
    }
}
