'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { AlertCircle } from 'lucide-react';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);
      
      const readableOperation = {
        'get': 'lecture',
        'list': 'liste',
        'create': 'création',
        'update': 'mise à jour',
        'delete': 'suppression',
        'write': 'écriture'
      }[error.context.operation];

      toast({
        variant: 'destructive',
        duration: 10000,
        title: "Permission Firestore Refusée",
        description: (
          <div className="mt-2 w-full">
            <p>L'opération de <strong>{readableOperation}</strong> sur le chemin <strong>{error.context.path}</strong> a été bloquée par les règles de sécurité.</p>
            {error.context.requestResourceData && (
                <div className="mt-2">
                    <p className="font-semibold">Données de la requête :</p>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                        <code>{JSON.stringify(error.context.requestResourceData, null, 2)}</code>
                    </pre>
                </div>
            )}
          </div>
        ),
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      // It's important to remove the listener when the component unmounts.
      // However, our simple event emitter doesn't support 'off'. In a real app, this would be necessary.
    };
  }, [toast]);

  return null; // This component does not render anything
}
