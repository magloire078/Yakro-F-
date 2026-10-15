'use client';

import * as React from 'react';
import Image from 'next/image';
import { Download, Share, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'yakro-pwa-install-dismissed-v1';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(true);

  React.useEffect(() => {
    // Vérifie si déjà installé en mode standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
    if (standalone) return;

    // Vérifie si l'utilisateur l'a masqué récemment (durée: 7 jours)
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return;
      }
    } catch {
      // Ignorer si localStorage n'est pas disponible
    }

    setIsDismissed(false);

    // Détection iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIos = /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    setIsIos(isAppleIos);

    // Interception de l'événement natif Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsDismissed(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      // Masquer pendant 7 jours
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {
      // Ignorer
    }
  };

  // Ne rien afficher si l'app est déjà installée, si masquée ou si ni prompt Android ni iOS
  if (isStandalone || isDismissed) {
    return null;
  }

  // Si ni prompt natif Android disponible ni iOS Safari, ne pas encombrer l'écran
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-primary/10">
        {/* Glow discret */}
        <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          {/* Logo App */}
          <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
            <Image
              src="/icons/icon-192x192.png"
              alt="Yakro-Fê"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>

          {/* Textes */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-black text-sm text-foreground tracking-tight">
                Installer Yakro-Fê
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {isIos ? (
                <>
                  Touchez <Share className="inline h-3.5 w-3.5 text-primary -mt-0.5" /> <strong>Partager</strong> puis <strong>« Sur l&apos;écran d&apos;accueil »</strong> pour installer l&apos;application.
                </>
              ) : (
                'Commandes plus rapides, suivi GPS en direct et alertes instantanées sur votre écran.'
              )}
            </p>

            {/* Boutons d'action */}
            {!isIos && deferredPrompt && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-3 shadow-md shadow-primary/20 transition-transform active:scale-95"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Installer l&apos;application
                </Button>
              </div>
            )}
          </div>

          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer le bandeau"
            className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
