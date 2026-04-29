'use client';

import * as React from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

const DISMISS_KEY = 'yakro-notif-prompt-dismissed';

export function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user) {
      setVisible(false);
      return;
    }
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    setVisible(true);
  }, [user]);

  if (!visible) return null;

  const handleDismiss = (persist = true) => {
    setVisible(false);
    if (persist) {
      try {
        window.localStorage.setItem(DISMISS_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  };

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications activées 🎉',
          description: 'Vous serez prévenu(e) à chaque étape de vos commandes.',
        });
      }
    } catch {
      /* ignore */
    } finally {
      handleDismiss();
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
      <Card className="border-primary/30 shadow-lg">
        <div className="flex items-start gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Activer les notifications ?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recevez un signal quand votre commande est acceptée, en route ou livrée.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={handleEnable}>Activer</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDismiss(true)}>Plus tard</Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => handleDismiss(true)}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
