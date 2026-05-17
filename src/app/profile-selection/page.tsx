'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader } from 'lucide-react';

export default function ProfileSelectionPage() {
    const { user, userProfile, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        // Redirection si non authentifié
        if (!authLoading && !user && !isRedirecting) {
            setIsRedirecting(true);
            router.replace('/login');
            return;
        }

        // Cas critique : authentifié mais pas de profil Firestore chargé
        if (!authLoading && user && !userProfile && !isRedirecting) {
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
    }, [user, userProfile, authLoading, router, activeRole, isRedirecting]);
    
    return (
        <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent" />
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px] animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-orange-500/10 p-5 rounded-2xl border border-orange-500/20 shadow-2xl shadow-orange-500/10">
                    <Loader className="h-12 w-12 animate-spin text-orange-500" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/70">Yakro Fê</p>
                    <p className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Initialisation</p>
                    <p className="text-xs font-medium text-muted-foreground/80">Configuration de votre profil…</p>
                </div>
            </div>
        </div>
    )
}
