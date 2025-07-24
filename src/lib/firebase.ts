
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "yakro-go",
  "appId": "1:102516892596:web:44d219ce96eb75352808e1",
  "storageBucket": "yakro-go.appspot.com",
  "apiKey": "AIzaSyBl9KMx5EuvhN71R81bNRqXuQhVdNKPGdc",
  "authDomain": "yakro-go.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "102516892596"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
