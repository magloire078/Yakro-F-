
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


function getFirebaseClient() {
    if (getApps().length) {
        const app = getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        return { app, auth, db, storage };
    } else {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        return { app, auth, db, storage };
    }
}

// Re-exporting the initialized services
const { app, auth, db, storage } = getFirebaseClient();
export { app, auth, db, storage, getFirebaseClient };
