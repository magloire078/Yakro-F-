
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Icons } from '@/components/icons';
import { UserAuthForm } from '@/components/user-auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import type { AppRole } from '@/lib/types';
import Link from 'next/link';

export default function LoginPage() {
    const { user, userProfile, loading: authLoading, setActiveRole, updateUserProfile } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        if (user && userProfile && !isRedirecting) {
            setIsRedirecting(true);

            if (userProfile.roleSysteme === 'SuperAdmin') {
                router.replace('/dashboard/admin');
                return;
            }
            
            const allowedRoles = userProfile.rolesAutorises || ['client'];
            const currentRole = userProfile.role;

            let roleToSet: AppRole = 'client';

            if (currentRole && allowedRoles.includes(currentRole)) {
                roleToSet = currentRole;
            } else if (allowedRoles.length > 0) {
                roleToSet = allowedRoles[0];
            }
            
            setActiveRole(roleToSet);

            if (!currentRole && user.uid) {
                updateUserProfile(user.uid, { role: roleToSet }).catch(console.error);
            }
            
            router.replace(`/auth/${roleToSet}`);
        }
    }, [user, userProfile, isRedirecting, router, setActiveRole, updateUserProfile]);
    
    if (authLoading || (user && userProfile) || isRedirecting) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Configuration de votre session...</p>
            </div>
        )
    }

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
             <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-primary" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Icons.logo className="h-8 w-8 mr-2 text-primary-foreground" />
                    Yakro Fê
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                    <p className="text-lg">
                        &ldquo;Cette application a transformé la façon dont je découvre les restaurants locaux. Un must-have pour tous les gourmands de Yakro !&rdquo;
                    </p>
                    <footer className="text-sm">Aïcha K., cliente satisfaite</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                 <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Connectez-vous à votre compte
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Entrez vos identifiants pour accéder à votre espace
                        </p>
                    </div>
                    <UserAuthForm />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        En cliquant sur continuer, vous acceptez nos{" "}
                        <Link
                            href="/terms"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Conditions d'utilisation
                        </Link>{" "}
                        et notre{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Politique de confidentialité
                        </Link>
                        .
                    </p>
                 </div>
            </div>
        </div>
    )
}
