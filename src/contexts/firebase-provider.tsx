'use client';

import * as React from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { getFirebaseClient } from '@/firebase/client';
import { Loader } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
}

const FirebaseContext = React.createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [firebase, setFirebase] = React.useState<FirebaseContextType | null>(null);

    React.useEffect(() => {
        const { app, auth, db, storage } = getFirebaseClient();
        setFirebase({ app, auth, db, storage });
    }, []);

    if (!firebase) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="ml-4">Connecting to Firebase...</p>
            </div>
        );
    }
    
    return (
        <FirebaseContext.Provider value={firebase}>
            <FirebaseErrorListener />
            {children}
        </FirebaseContext.Provider>
    )
};

export const useFirebase = () => {
  const context = React.useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
