
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (e: any) {
        console.error('Firebase admin initialization error', e.stack);
    }
}

export const auth = admin.auth;
export const firestore = admin.firestore;
