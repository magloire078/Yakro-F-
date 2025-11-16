'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const isAuthorized = userProfile?.roleSysteme === 'SuperAdmin' ||
                             userProfile?.roleSysteme === 'Admin' ||
                             userProfile?.rolesAutorises?.includes('restaurateur');

        if (!isAuthorized) {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Vous n\'avez pas les permissions pour accéder à ce tableau de bord.',
            });
            router.push('/');
        }
    }, [user, userProfile, loading, router, toast]);

    if (loading || !user) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

  return <>{children}</>;
}
