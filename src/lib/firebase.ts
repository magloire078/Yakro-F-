

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';

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

// Initialize App Check only in a browser context.
if (typeof window !== 'undefined') {
  let appCheckProvider;
  
  if (process.env.NODE_ENV === 'development') {
    // Use a debug provider in development.
    // This requires setting a debug token in the Firebase console.
    // You will see a message in the console with the debug token.
    console.log("Initializing App Check with debug provider.");
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    appCheckProvider = new CustomProvider({
        getToken: () =>
            Promise.resolve({
                token: 'debug-token',
                expireTimeMillis: Date.now() + 60 * 60 * 1000, // 1 hour
            }),
    });
  } else {
    // Use reCAPTCHA v3 in production.
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      console.log("Initializing App Check with reCAPTCHA v3 provider.");
      appCheckProvider = new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
    } else {
      console.warn("Firebase App Check is not initialized in production. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to your .env file.");
    }
  }

  if (appCheckProvider) {
    try {
      initializeAppCheck(app, {
        provider: appCheckProvider,
        isTokenAutoRefreshEnabled: true
      });
    } catch(e) {
      console.error("Failed to initialize Firebase App Check", e);
    }
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
