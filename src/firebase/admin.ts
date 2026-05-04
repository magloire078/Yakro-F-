import 'server-only';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;

/**
 * Lazily initialise the Firebase Admin SDK. Uses Application Default
 * Credentials, which are provided automatically on Firebase App Hosting /
 * Cloud Functions and locally via `GOOGLE_APPLICATION_CREDENTIALS` pointing
 * to a service-account JSON. Throws a clear error if called without creds
 * configured — server actions catch the error and return a typed failure
 * to the client.
 */
function ensureAdmin(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app!;
  }

  app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT
      ?? process.env.FIREBASE_PROJECT_ID
      ?? 'yakro-go',
  });
  return app;
}

export function getAdminDb(): Firestore {
  return getFirestore(ensureAdmin());
}

export function getAdminAuth(): Auth {
  return getAuth(ensureAdmin());
}
