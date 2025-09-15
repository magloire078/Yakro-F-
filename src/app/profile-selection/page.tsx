
'use client';

import * as React from 'react';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { AppRole } from '@/lib/types';

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading, setActiveRole, updateUserProfile } = useAuth();
    
    React.useEffect(() => {
        if (authLoading) {
            return; // Attendre la fin du chargement
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (userProfile) {
            // Special path for SuperAdmin
            if (userProfile.roleSysteme === 'SuperAdmin') {
                router.push('/dashboard/admin');
                return;
            }

            const roleToSet = userProfile.role || userProfile.rolesAutorises?.[0] || 'client';
            setActiveRole(roleToSet);

            // Si le profil n'a pas de rôle principal défini, on le met à jour
            if (!userProfile.role) {
                updateUserProfile(user.uid, { role: roleToSet });
            }
            
            router.push('/');
        }
        // Si userProfile n'est pas encore là, le useEffect dans auth-context s'en chargera

    }, [user, userProfile, authLoading, router, setActiveRole, updateUserProfile]);
    
    // Afficher un chargeur pendant le traitement
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">Configuration de votre session...</p>
        </div>
    )
}
