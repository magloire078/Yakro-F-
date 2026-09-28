'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader } from 'lucide-react';

export default function ProfileSelectionPage() {
    const { user, userProfile, profileError, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        // Redirection si non authentifié
        if (!authLoading && !user && !isRedirecting) {
            setIsRedirecting(true);
            router.replace('/login');
            return;
        }

        // Profil absent : on ne considère qu'il s'agit d'un nouvel
        // utilisateur (et donc qu'on peut l'envoyer créer son profil) que si
        // la lecture Firestore a confirmé l'absence du document. Si elle a
        // échoué en permission (voir `profileError`), un compte existant
        // (ex. SuperAdmin) pourrait sinon se retrouver sur /complete-profile
        // et écraser son propre profil en le soumettant — on affiche une
        // erreur avec option de réessayer à la place (rendu plus bas).
        if (!authLoading && user && !userProfile && !profileError && !isRedirecting) {
            setIsRedirecting(true);
            router.replace('/complete-profile');
            return;
        }

        // Redirection vers le tableau de bord approprié
        if (userProfile && !isRedirecting) {
            setIsRedirecting(true);
            const role = activeRole || userProfile.role || 'client';
            
            if (userProfile.roleSysteme === 'SuperAdmin') {
                router.replace('/dashboard/admin');
            } else if (role === 'restaurateur') {
                router.replace('/restaurateur');
            } else if (role === 'livreur') {
                router.replace('/livreur');
            } else {
                router.replace('/');
            }
        }
    }, [user, userProfile, profileError, authLoading, router, activeRole, isRedirecting]);

    // Échec de chargement du profil (ex. permission refusée) plutôt
    // qu'absence confirmée : on n'envoie jamais vers /complete-profile dans
    // ce cas (voir l'effet ci-dessus), on propose de réessayer à la place.
    if (!authLoading && user && !userProfile && profileError) {
        return (
            <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden px-4">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-destructive/10 p-5 rounded-2xl border border-destructive/20 shadow-2xl shadow-destructive/10">
                        <Loader className="h-12 w-12 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive/70">Yakro Fê</p>
                        <p className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Erreur de chargement</p>
                        <p className="text-xs font-medium text-muted-foreground/80">
                            Impossible de charger votre profil pour le moment. Vérifiez votre connexion puis réessayez.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black italic uppercase tracking-widest text-sm shadow-2xl shadow-primary/20"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Yakro Fê</p>
                    <p className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Initialisation</p>
                    <p className="text-xs font-medium text-muted-foreground/80">Configuration de votre profil…</p>
                </div>
            </div>
        </div>
    )
}
