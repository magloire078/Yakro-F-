'use client';

import * as React from 'react';
import { Download, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

const DISMISS_KEY = 'yakro-install-prompt-dismissed-v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    // Déjà installée ?
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Délai si pas connecté : laisse l'utilisateur arriver sur l'app avant d'inviter à l'installer.
  if (!user || !visible || !deferredPrompt) return null;

  const dismiss = (persist = true) => {
    setVisible(false);
    if (persist) {
      try {
        window.localStorage.setItem(DISMISS_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    dismiss();
  };

  return (
    <div className="fixed bottom-36 md:bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40">
      <Card className="border-primary/30 shadow-lg">
        <div className="flex items-start gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Installer Yakro Fê</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accès direct depuis votre écran d'accueil, plus rapide qu'un favori navigateur.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={handleInstall}>Installer</Button>
              <Button size="sm" variant="ghost" onClick={() => dismiss(true)}>Plus tard</Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => dismiss(true)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
