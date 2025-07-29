
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ChefHat, Loader, Bike } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/lib/types';

export default function ProfileSelectionPage() {
    const router = useRouter();
    const { user, loading, activeRole, setActiveRole } = useAuth();
    const [isInitialRedirect, setIsInitialRedirect] = React.useState(true);

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        
        const savedRole = localStorage.getItem('activeRole') as UserRole;
        if (!loading && user && savedRole && isInitialRedirect) {
            // Always redirect to home page, it will handle the role display
            router.push('/');
        } else {
            setIsInitialRedirect(false);
        }
    }, [user, loading, router, isInitialRedirect]);

    const handleProfileSelect = (role: UserRole) => {
        setActiveRole(role);
        router.push('/');
    };
    
    if (loading || isInitialRedirect) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl font-headline text-primary mb-4">Quel type de profil souhaitez-vous utiliser ?</h1>
            <p className="text-muted-foreground mb-12 max-w-2xl">
                Choisissez le profil qui correspond à votre utilisation de Yakro Go. Vous pourrez explorer les fonctionnalités correspondantes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                
                <Card 
                    onClick={() => handleProfileSelect('client')}
                    className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                >
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
                
                
                <Card 
                    onClick={() => handleProfileSelect('restaurateur')}
                    className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                >
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

                <Card 
                    onClick={() => handleProfileSelect('livreur')}
                    className="h-full flex flex-col items-center justify-center p-8 text-center hover:bg-accent/50 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                >
                    <CardHeader>
                        <Bike className="h-16 w-16 mx-auto text-primary" />
                        <CardTitle className="mt-4 text-2xl">Je suis un Livreur</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <CardDescription>
                           Acceptez des courses, suivez vos livraisons et gérez vos revenus.
                        </CardDescription>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
