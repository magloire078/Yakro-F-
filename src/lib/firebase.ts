
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  "projectId": "yakro-go",
  "appId": "1:102516892596:web:44d219ce96eb75352808e1",
  "storageBucket": "yakro-go.appspot.com",
  "apiKey": "YOUR_API_KEY",
  "authDomain": "yakro-go.firebaseapp.com",
  "messagingSenderId": "102516892596"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db };

// This is a separate export for use in server-side actions,
// where we might use a server-initialized app in the future.
// For now, it shares the client-side instance.
export const firestore = db;
