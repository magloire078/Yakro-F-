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
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-lg">Initialisation de votre profil...</p>
            </div>
        </div>
    )
}
