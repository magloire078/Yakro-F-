import 'server-only';
import { initializeApp, getApps, App, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;

/**
 * Lazily initialise the Firebase Admin SDK.
 *
 * On Firebase App Hosting / Cloud Functions and locally (via
 * `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service-account JSON),
 * Application Default Credentials are available for free. Vercel provides
 * no ADC at all, so there `FIREBASE_SERVICE_ACCOUNT_KEY` (the full
 * service-account JSON, as one env var) must be set explicitly — without
 * it every Admin SDK call (notifications, stock actions, payments) would
 * fail silently in production.
 */
function ensureAdmin(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
          ?? process.env.GOOGLE_CLOUD_PROJECT
          ?? process.env.FIREBASE_PROJECT_ID
          ?? 'yakro-go',
      });
      return app;
    } catch (error) {
      console.error('firebase/admin: FIREBASE_SERVICE_ACCOUNT_KEY is set but could not be parsed as valid service-account JSON. Falling back to Application Default Credentials.', error);
    }
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
