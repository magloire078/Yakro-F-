'use server';

import { auth as adminAuth, firestore } from '../../../firebase-admin-init';
import { headers } from 'next/headers';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

/**
 * Verifies if the current user is a SuperAdmin based on their session.
 * This is a server-side check.
 */
async function verifySuperAdmin(): Promise<string> {
    const sessionCookie = headers().get('__session')?.toString();
    if (!sessionCookie) {
        throw new Error('Authentication required: No session cookie found.');
    }
    
    try {
        const decodedClaims = await adminAuth().verifySessionCookie(sessionCookie, true);
        const userDocRef = doc(firestore(), 'utilisateurs', decodedClaims.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().systemRole === 'SuperAdmin') {
            return decodedClaims.uid;
        } else {
            throw new Error('Permission denied: User is not a SuperAdmin.');
        }
    } catch (error) {
        console.error("Verification failed:", error);
        throw new Error('Authentication failed or permission denied.');
    }
}


/**
 * Server action to get all users from Firestore.
 * This action is protected and can only be executed by a SuperAdmin.
 */
export async function getAllUsersAction(): Promise<UserProfile[]> {
    try {
        await verifySuperAdmin(); // Protect the action
        
        const usersCollectionRef = collection(firestore(), 'utilisateurs');
        const usersSnapshot = await getDocs(usersCollectionRef);
        
        const usersList = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as UserProfile));

        return usersList;

    } catch (error) {
        console.error("Error in getAllUsersAction:", error);
        // Return an empty array or re-throw the error depending on desired client-side handling
        return [];
    }
}
