import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "yakro-go.firebaseapp.com",
  databaseURL: "https://yakro-go-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yakro-go",
  storageBucket: "yakro-go.firebasestorage.app",
  messagingSenderId: "102516892596",
  appId: "1:102516892596:web:44d219ce96eb75352808e1",
  measurementId: "G-BZXTLHE681"
};

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | undefined;

/**
 * Initialize Firebase services safely for client-side use.
 */
function initFirebase() {
  try {
    if (getApps().length === 0) {
      if (!firebaseConfig.apiKey) {
        throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is missing. Check your .env file.");
      }
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (!app) return;

    // Initialize missing services if they haven't been initialized yet
    if (!auth) {
        auth = getAuth(app);
    }
    
    if (!db) {
        db = getFirestore(app);
    }
    
    if (!storage) {
        storage = getStorage(app);
    }

    if (!analytics && typeof window !== 'undefined') {
        isSupported().then(supported => {
            if (supported && app) {
                analytics = getAnalytics(app);
            }
        }).catch(err => console.warn("Analytics not supported or failed to load:", err));
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    throw error; // Rethrow to let the provider handle it
  }
}

// Ensure initialization happens early but only once
initFirebase();

export function getFirebaseClient() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, db: null, storage: null, analytics: undefined };
  }

  // Always try to init missing services if called
  initFirebase();
  
  return { app, auth, db, storage, analytics };
}

export { app, auth, db, storage, analytics };
