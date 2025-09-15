
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Icons } from '@/components/icons';
import { UserAuthForm } from '@/components/user-auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const { user } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (user) {
            router.push('/profile-selection');
        }
    }, [user, router]);
    
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
