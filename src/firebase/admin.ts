import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "yakro-go",
    });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
