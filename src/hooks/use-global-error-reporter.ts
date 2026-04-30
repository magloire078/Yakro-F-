'use client';

import * as React from 'react';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { reportError } from '@/lib/error-reporter';

/**
 * Capture les erreurs JS globales (window.onerror, unhandledrejection)
 * et les pousse dans la collection /erreurs pour audit côté admin.
 */
export function useGlobalErrorReporter() {
  const { db } = useFirebase();
  const { user } = useAuth();
  const ctxRef = React.useRef({
    db,
    userId: user?.uid ?? null,
    userEmail: user?.email ?? null,
  });

  React.useEffect(() => {
    ctxRef.current = {
      db,
      userId: user?.uid ?? null,
      userEmail: user?.email ?? null,
    };
  }, [db, user]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const onError = (event: ErrorEvent) => {
      reportError('window', event.error || event.message, ctxRef.current);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reportError('unhandledrejection', event.reason, ctxRef.current);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
}
