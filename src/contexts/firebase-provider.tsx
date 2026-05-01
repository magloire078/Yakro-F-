'use client';

import * as React from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { getFirebaseClient } from '@/firebase/client';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Button } from '@/components/ui/button';

interface FirebaseContextType {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
}

const FirebaseContext = React.createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [firebase, setFirebase] = React.useState<FirebaseContextType | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const initAttempted = React.useRef(false);

    React.useEffect(() => {
        if (initAttempted.current) return;
        initAttempted.current = true;

        const GLOBAL_TIMEOUT = 30000;
        const POLL_INTERVAL = 500;

        const timeoutId = setTimeout(() => {
            if (!firebase) {
                console.warn("FirebaseProvider: Global timeout reached.");
                setError("La connexion à Firebase prend plus de temps que prévu. Veuillez vérifier votre connexion internet.");
            }
        }, GLOBAL_TIMEOUT);

        let pollIntervalId: ReturnType<typeof setInterval> | undefined;

        const init = async () => {
            try {
                const checkFirebase = () => {
                    const client = getFirebaseClient();
                    const status = {
                        app: !!client.app,
                        auth: !!client.auth,
                        db: !!client.db,
                        storage: !!client.storage
                    };
                    
                    if (status.app && status.auth && status.db && status.storage) {
                        setFirebase({
                           app: client.app!,
                           auth: client.auth!,
                           db: client.db!,
                           storage: client.storage!
                        });
                        setError(null);
                        return true;
                    }
                    

                    return false;
                };

                let attempts = 0;
                const MAX_ATTEMPTS = 10;

                if (!checkFirebase()) {
                    pollIntervalId = setInterval(() => {
                        attempts++;
                        if (checkFirebase()) {
                            clearInterval(pollIntervalId);
                        } else if (attempts >= MAX_ATTEMPTS) {
                            clearInterval(pollIntervalId);
                            setError("Certains services Firebase ne répondent pas. Veuillez vérifier que votre clé API est valide et que vous n'avez pas de bloqueur de script.");
                        }
                    }, POLL_INTERVAL);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Inconnue";
                console.error("FirebaseProvider: Unexpected init error:", err);
                setError(`Erreur d'initialisation : ${errorMessage}`);
            }
        };

        init();
        return () => {
            clearTimeout(timeoutId);
            if (pollIntervalId) clearInterval(pollIntervalId);
        };
    }, [firebase]); 


    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Erreur de Connexion</h2>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                </Button>
            </div>
        );
    }

    if (!firebase) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 font-medium">Connexion à Firebase...</p>
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
