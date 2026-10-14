'use client';

import * as React from 'react';
import { BellRing, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
    enablePushNotifications,
    getPushAvailability,
    onForegroundPush,
    refreshPushRegistration,
    type PushAvailability,
} from '@/lib/push-client';

const DISMISS_KEY = 'yakro-push-prompt-dismissed';

const BENEFIT_BY_ROLE: Record<string, string> = {
    restaurateur: 'Recevez vos nouvelles commandes, même application fermée.',
    livreur: 'Soyez alerté dès qu’une course est prête à récupérer.',
    client: 'Suivez votre commande : acceptée, en route, livrée.',
};

function readDismissed(uid: string): boolean {
    try {
        return localStorage.getItem(`${DISMISS_KEY}-${uid}`) === '1';
    } catch {
        return false;
    }
}

/**
 * Notifications push : réinscrit l'appareil à chaque connexion, affiche les
 * notifications reçues app ouverte, et propose de les activer.
 */
export function PushNotifications() {
    const { user, activeRole } = useAuth();
    const { toast } = useToast();
    const [availability, setAvailability] = React.useState<PushAvailability | null>(null);
    const [dismissed, setDismissed] = React.useState(true);
    const [isEnabling, setIsEnabling] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        setDismissed(readDismissed(user.uid));
        getPushAvailability().then(setAvailability).catch(() => setAvailability('unsupported'));
        void refreshPushRegistration();
    }, [user]);

    React.useEffect(() => {
        if (!user) return;
        return onForegroundPush((data) => {
            toast({ title: data.title, description: data.body });
            // Le son et la vibration ne sont pas joués app ouverte : on vibre
            // brièvement quand l'appareil le permet.
            if ('vibrate' in navigator) navigator.vibrate?.(200);
        });
    }, [user, toast]);

    if (!user || dismissed || !availability) return null;
    if (availability !== 'default' && availability !== 'ios-needs-install') return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(`${DISMISS_KEY}-${user.uid}`, '1');
        } catch {
            // Stockage indisponible : le bandeau réapparaîtra, sans gravité.
        }
    };

    const enable = async () => {
        setIsEnabling(true);
        try {
            const result = await enablePushNotifications();
            setAvailability(result);
            if (result === 'granted') {
                toast({ title: 'Notifications activées', description: 'Vous serez prévenu même application fermée.' });
            } else if (result === 'denied') {
                toast({ variant: 'destructive', title: 'Notifications refusées', description: 'Vous pourrez les réactiver dans les réglages du navigateur.' });
            }
        } catch (error) {
            console.error('Activation des notifications impossible:', error);
            toast({ variant: 'destructive', title: 'Activation impossible', description: 'Réessayez dans un instant.' });
        } finally {
            setIsEnabling(false);
        }
    };

    const benefit = BENEFIT_BY_ROLE[activeRole ?? 'client'] ?? BENEFIT_BY_ROLE.client;

    return (
        <div className="mx-3 mt-3 sm:mx-4 md:mx-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Activer les notifications</p>
                {availability === 'ios-needs-install' ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Sur iPhone, ajoutez d&apos;abord Yakro Fê à l&apos;écran d&apos;accueil : touchez{' '}
                        <Share className="inline h-3.5 w-3.5 -mt-0.5" /> Partager, puis « Sur l&apos;écran d&apos;accueil ». Ouvrez ensuite l&apos;app depuis son icône.
                    </p>
                ) : (
                    <>
                        <p className="text-xs text-muted-foreground leading-relaxed">{benefit}</p>
                        <Button size="sm" onClick={enable} disabled={isEnabling} className="mt-2 h-8 rounded-lg text-xs font-bold">
                            {isEnabling ? 'Activation…' : 'Activer'}
                        </Button>
                    </>
                )}
            </div>
            <button type="button" onClick={dismiss} aria-label="Masquer" className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
