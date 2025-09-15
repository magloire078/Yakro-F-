
'use client';

import * as React from 'react';

// This component is no longer used while login is disabled, 
// but we'll keep the file with a placeholder.

export function UserAuthForm({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <div className="text-center text-muted-foreground">
      Le système de connexion est temporairement désactivé.
    </div>
  );
}
