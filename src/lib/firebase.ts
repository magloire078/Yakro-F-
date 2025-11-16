
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "yakro-go.firebaseapp.com",
  projectId: "yakro-go",
  storageBucket: "yakro-go.appspot.com",
  messagingSenderId: "102516892596",
  appId: "1:102516892596:web:44d219ce96eb75352808e1",
  measurementId: "G-BZXTLHE681"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
    isTokenAutoRefreshEnabled: true
  });
}

const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db };

// This is a separate export for use in server-side actions,
// where we might use a server-initialized app in the future.
// For now, it shares the client-side instance.
export const firestore = db;
