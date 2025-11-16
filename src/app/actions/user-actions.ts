
'use server';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type SetupInitialUserParams = {
    uid: string;
    email: string;
    nom?: string | null;
    telephone?: string;
}

export async function setupInitialUserAction(userData: SetupInitialUserParams) {
    const userDocRef = doc(db, 'utilisateurs', userData.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUserProfile: UserProfile = {
            uid: userData.uid,
            email: userData.email,
            nom: userData.nom || userData.email.split('@')[0] || 'Nouvel utilisateur',
            dateCreation: serverTimestamp(),
            role: 'client',
            rolesAutorises: ['client'],
            roleSysteme: 'User',
            ...(userData.telephone && { telephone: userData.telephone }),
        };
        
        try {
            await setDoc(userDocRef, newUserProfile);
        } catch(e) {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    }
}
