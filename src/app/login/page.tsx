
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Icons } from '@/components/icons';
import { UserAuthForm } from '@/components/user-auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { AppRole } from '@/lib/types';

export default function LoginPage() {
    const { user, userProfile, loading: authLoading, setActiveRole, updateUserProfile } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        // This effect handles redirection AFTER a user is logged in and their profile is loaded.
        if (user && userProfile && !isRedirecting) {
            setIsRedirecting(true);

            // Special path for SuperAdmin
            if (userProfile.roleSysteme === 'SuperAdmin') {
                router.replace('/dashboard/admin');
                return;
            }
            
            const allowedRoles = userProfile.rolesAutorises || ['client'];
            const currentRole = userProfile.role;

            let roleToSet: AppRole = 'client'; // Default role

            if (currentRole && allowedRoles.includes(currentRole)) {
                roleToSet = currentRole;
            } else if (allowedRoles.length > 0) {
                roleToSet = allowedRoles[0];
            }
            
            setActiveRole(roleToSet);

            // If the profile doesn't have a main role set, update it.
            if (!currentRole && user.uid) {
                updateUserProfile(user.uid, { role: roleToSet }).catch(console.error);
            }
            
            // Redirect to the role-specific auth page
            router.replace(`/auth/${roleToSet}`);
        }
    }, [user, userProfile, isRedirecting, router, setActiveRole, updateUserProfile]);
    
    // Show a loading spinner if we are in the process of authenticating or redirecting
    if (authLoading || isRedirecting) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Configuration de votre session...</p>
            </div>
        )
    }

    // Show login form only if not logged in and not loading/redirecting
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="max-w-sm w-full">
                <CardHeader className="text-center">
                    <Icons.logo className="h-16 w-16 mx-auto text-primary" />
                    <CardTitle className="text-3xl font-headline mt-4">Bienvenue sur Yakro Fê</CardTitle>
                    <CardDescription>Connectez-vous pour continuer</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserAuthForm />
                </CardContent>
            </Card>
        </div>
    )
}
