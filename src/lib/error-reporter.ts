'use client';

import { addDoc, collection } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { ErrorReport, ErrorSource } from './types';

const MAX_STACK_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 1000;

interface ReportContext {
  db: Firestore;
  userId?: string | null;
  userEmail?: string | null;
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export async function reportError(
  source: ErrorSource,
  error: unknown,
  ctx: ReportContext
): Promise<void> {
  if (typeof window === 'undefined') return;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : (() => {
          try {
            return JSON.stringify(error);
          } catch {
            return String(error);
          }
        })();

  const stack = error instanceof Error ? error.stack : undefined;

  const payload: Omit<ErrorReport, 'id'> = {
    source,
    message: truncate(message || 'Erreur inconnue', MAX_MESSAGE_LENGTH),
    ...(stack && { stack: truncate(stack, MAX_STACK_LENGTH) }),
    path: window.location.pathname || '/',
    userAgent: navigator.userAgent,
    userId: ctx.userId ?? null,
    userEmail: ctx.userEmail ?? null,
    date: new Date().toISOString(),
    resolu: false,
  };

  try {
    await addDoc(collection(ctx.db, 'erreurs'), payload);
  } catch {
    // Silencieux : on ne veut pas créer de boucle d'erreurs si /erreurs lui-même échoue.
  }
}
