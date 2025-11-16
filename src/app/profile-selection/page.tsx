
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSelectionPage() {
    const { user, userProfile, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        if (userProfile) {
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
    }, [user, userProfile, authLoading, router, activeRole]);
    
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Chargement de votre profil...</p>
            </div>
        </div>
    )
}
