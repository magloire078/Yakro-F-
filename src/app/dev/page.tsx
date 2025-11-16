
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { seedDatabaseAction } from '@/app/actions/seed-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DevPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [isSeeding, setIsSeeding] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading) {
            if (!user || userProfile?.roleSysteme !== 'SuperAdmin') {
                toast({
                    variant: 'destructive',
                    title: 'Accès non autorisé',
                    description: 'Cette page est réservée aux administrateurs.',
                });
                router.push('/');
            }
        }
    }, [user, userProfile, authLoading, router, toast]);

    const handleSeedDatabase = async () => {
        if (!user) return;
        setIsSeeding(true);
        toast({
            title: 'Peuplement de la base de données...',
            description: 'Cette opération peut prendre quelques instants.',
        });
        try {
            const result = await seedDatabaseAction(user.uid);
            if (result.success) {
                toast({
                    title: 'Base de données peuplée !',
                    description: result.message,
                });
            } else {
                toast({
                    variant: 'default',
                    title: 'Opération ignorée',
                    description: result.message,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur lors du peuplement',
                description: error.message || "Une erreur est survenue.",
            });
        } finally {
            setIsSeeding(false);
        }
    };
    
    if (authLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline text-primary mb-8">Outils de Développement</h1>
            <div className="max-w-lg mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Base de données</CardTitle>
                        <CardDescription>Actions relatives à la base de données Firestore.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-semibold">Peupler la base de données</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ajoute les restaurants et plats initiaux à la base de données. Ne fonctionne que si la collection de restaurants est vide.
                                </p>
                            </div>
                            <Button onClick={handleSeedDatabase} disabled={isSeeding}>
                                {isSeeding ? <Loader className="animate-spin" /> : <Database />}
                                Lancer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
