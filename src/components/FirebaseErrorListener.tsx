'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';


export function FirebaseErrorListener() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);

      // Cet écouteur est un outil de débogage pour le développement : il
      // expose le chemin Firestore exact et, parfois, le contenu de la
      // requête (`requestResourceData`) dans un toast affiché à l'écran.
      // Un vrai utilisateur en production n'a jamais besoin de voir ces
      // détails internes — ça ne fait que l'inquiéter et fuite des
      // informations sur la structure de la base. Chaque appel qui peut
      // légitimement échouer gère déjà son propre message d'erreur
      // (voir les blocs catch de user-auth-form.tsx, restaurant-manager.tsx,
      // etc.) ; celui-ci reste utile uniquement pour le débogage local.
      if (process.env.NODE_ENV !== 'development') {
        return;
      }

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
            <p>L&apos;opération de <strong>{readableOperation}</strong> sur le chemin <strong>{error.context.path}</strong> a été bloquée par les règles de sécurité.</p>
            {!!error.context.requestResourceData && (
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
