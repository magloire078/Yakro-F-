'use client';

import * as React from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/contexts/auth-context';

// This component is only for development builds to surface rich errors.
export function FirebaseErrorListener() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleError = async (error: FirestorePermissionError) => {
      let authContext = {};
      if (user) {
        authContext = {
          uid: user.uid,
          token: await user.getIdTokenResult(),
        };
      }

      const detailedError = {
        message: `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:`,
        details: {
          auth: authContext,
          method: error.context.operation,
          path: `/databases/(default)/documents/${error.context.path}`,
          ...(error.context.requestResourceData && { resource: { data: error.context.requestResourceData } }),
        },
      };

      // This will be caught by the Next.js development error overlay
      console.error(JSON.stringify(detailedError, null, 2));
    };

    errorEmitter.on('permission-error', handleError);

  }, [user]);

  return null; // This component does not render anything
}
