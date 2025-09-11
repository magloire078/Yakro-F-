
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
 * Server action to get all users from the Firestore 'utilisateurs' collection.
 * This action is protected and can only be executed by a SuperAdmin.
 */
export async function getAllUsersAction(): Promise<UserProfile[]> {
    try {
        await verifySuperAdmin(); // Protect the action
        
        // Get all user profiles from Firestore
        const usersCollectionRef = collection(firestore(), 'utilisateurs');
        const usersSnapshot = await getDocs(usersCollectionRef);

        const usersList: UserProfile[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                email: data.email || 'N/A',
                createdAt: data.createdAt,
                name: data.name || 'Non défini',
                phone: data.phone,
                defaultAddress: data.defaultAddress,
                role: data.role,
                systemRole: data.systemRole || 'User',
                allowedRoles: data.allowedRoles || ['client'],
            };
        });

        return usersList;

    } catch (error) {
        console.error("Error in getAllUsersAction:", error);
        // On error, return an empty array to prevent crashing the client.
        // This is often a permissions issue if the server environment isn't set up correctly.
        return [];
    }
}
