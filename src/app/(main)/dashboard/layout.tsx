'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (userProfile?.roleSysteme !== 'SuperAdmin' && userProfile?.roleSysteme !== 'Admin' && (!userProfile?.rolesAutorises?.includes('restaurateur'))) {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Vous n\'avez pas les permissions pour accéder à ce tableau de bord.',
            });
            router.push('/');
        }
    }, [user, userProfile, router, toast]);

  return <>{children}</>;
}
