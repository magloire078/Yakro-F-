
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, User, Utensils, Bike, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleConfig = {
    client: { icon: User, name: 'Client', description: 'Commander des plats' },
    restaurateur: { icon: Utensils, name: 'Restaurateur', description: 'Gérer vos établissements' },
    livreur: { icon: Bike, name: 'Livreur', description: 'Gérer vos courses' },
    admin: { icon: Shield, name: 'Admin', description: 'Gérer la plateforme' }
}

export default function ProfileSelectionPage() {
    const { user, userProfile, loading: authLoading, setActiveRole } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    const handleRoleSelect = (role: 'client' | 'restaurateur' | 'livreur') => {
        setActiveRole(role);
        if (role === 'restaurateur') {
            router.push('/restaurateur');
        } else if (role === 'livreur') {
            router.push('/livreur');
        } else {
            router.push('/');
        }
    };
    
    if (authLoading || !userProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    const availableRoles = userProfile.rolesAutorises || ['client'];
    
     if (availableRoles.length <= 1 && userProfile.roleSysteme !== 'SuperAdmin') {
        const role = availableRoles[0] || 'client';
        setActiveRole(role);
        toast({ title: "Redirection...", description: `Vous n'avez qu'un seul rôle disponible.`});
        if (role === 'restaurateur') {
            router.replace('/restaurateur');
        } else if (role === 'livreur') {
            router.replace('/livreur');
        } else {
            router.replace('/');
        }
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }


    return (
        <div className="container flex min-h-screen flex-col items-center justify-center">
            <h1 className="text-3xl font-headline mb-4">Bienvenue, {userProfile.nom} !</h1>
            <p className="text-muted-foreground mb-8 text-lg">Veuillez choisir un profil pour continuer.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                {availableRoles.map(role => {
                    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.client;
                    return (
                        <Card 
                            key={role} 
                            className="text-center p-8 hover:shadow-xl hover:border-primary transition-all cursor-pointer"
                            onClick={() => handleRoleSelect(role as any)}
                        >
                            <CardHeader>
                                <config.icon className="h-16 w-16 mx-auto text-primary" />
                                <CardTitle className="text-2xl mt-4">{config.name}</CardTitle>
                                <CardDescription>{config.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
