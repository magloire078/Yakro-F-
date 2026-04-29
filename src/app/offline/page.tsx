'use client';

import { WifiOff, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl md:text-3xl font-headline text-primary mb-2">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Yakro Fê a besoin d'une connexion pour rafraîchir les restaurants, le panier et les commandes en cours.
        Reconnectez-vous puis réessayez.
      </p>
      <Button onClick={() => window.location.reload()}>
        <RefreshCcw className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
}
