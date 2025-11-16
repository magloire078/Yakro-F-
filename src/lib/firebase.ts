
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "yakro-go.firebaseapp.com",
  projectId: "yakro-go",
  storageBucket: "yakro-go.appspot.com",
  messagingSenderId: "102516892596",
  appId: "1:102516892596:web:44d219ce96eb75352808e1",
  measurementId: "G-BZXTLHE681"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check only if the reCAPTCHA site key is available and in a browser context.
if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    } catch(e) {
      console.error("Failed to initialize Firebase App Check", e);
    }
  } else {
    console.warn("Firebase App Check is not initialized. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to your .env file.");
  }
}

const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db };

// This is a separate export for use in server-side actions,
// where we might use a server-initialized app in the future.
// For now, it shares the client-side instance.
export const firestore = db;
