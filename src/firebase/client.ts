
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// This function can be used in components to get the initialized services.
export function getFirebaseClient() {
    return { app, auth, db, storage };
}

// Re-exporting for direct import if needed, though getFirebaseClient is preferred.
export { app, auth, db, storage };
