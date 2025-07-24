
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ChefHat, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-headline text-primary mb-4">Quel type de profil souhaitez-vous créer ?</h1>
            <p className="text-muted-foreground mb-12 max-w-2xl">
                Choisissez le profil qui correspond à votre utilisation de Yakro Go. Vous pourrez explorer les fonctionnalités correspondantes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <Link href="/" className="h-full">
                    <Card className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl">
                        <CardHeader>
                            <User className="h-16 w-16 mx-auto text-primary" />
                            <CardTitle className="mt-4 text-2xl">Je suis un Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Parcourez les restaurants, découvrez de nouveaux plats et passez vos commandes en quelques clics.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard" className="h-full">
                    <Card className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl">
                         <CardHeader>
                            <ChefHat className="h-16 w-16 mx-auto text-primary" />
                            <CardTitle className="mt-4 text-2xl">Je suis un Restaurateur</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <CardDescription>
                                Gérez votre menu, créez des plats avec l'IA et développez votre activité grâce à nos outils marketing.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
