
'use server';

import { auth as adminAuth, firestore } from '../../../firebase-admin-init';
import { headers } from 'next/headers';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import type { UserRecord } from 'firebase-admin/auth';

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
 * Server action to get all users from Firebase Authentication and merge with Firestore profiles.
 * This action is protected and can only be executed by a SuperAdmin.
 */
export async function getAllUsersAction(): Promise<UserProfile[]> {
    try {
        await verifySuperAdmin(); // Protect the action
        
        // Get all users from Firebase Auth
        const listUsersResult = await adminAuth().listUsers();
        const authUsers = listUsersResult.users;

        // Get all user profiles from Firestore
        const usersCollectionRef = collection(firestore(), 'utilisateurs');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const firestoreProfiles = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data()]));

        // Merge Auth users with Firestore profiles
        const mergedUsers: UserProfile[] = authUsers.map((authUser: UserRecord) => {
            const firestoreProfile = firestoreProfiles.get(authUser.uid);
            
            return {
                uid: authUser.uid,
                email: authUser.email || 'N/A',
                createdAt: authUser.metadata.creationTime,
                name: firestoreProfile?.name || authUser.displayName,
                phone: firestoreProfile?.phone,
                defaultAddress: firestoreProfile?.defaultAddress,
                role: firestoreProfile?.role,
                systemRole: firestoreProfile?.systemRole || 'User',
                allowedRoles: firestoreProfile?.allowedRoles || ['client'],
            };
        });

        return mergedUsers;

    } catch (error) {
        console.error("Error in getAllUsersAction:", error);
        // On error, return an empty array to prevent crashing the client.
        return [];
    }
}
