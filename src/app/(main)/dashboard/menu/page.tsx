
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, BookOpenCheck, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function DashboardMenuPage() {
    const { user, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const { restaurants, menuItems, isLoading } = useData();
    const { toast } = useToast();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && activeRole !== 'restaurateur') {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Veuillez sélectionner le profil "Restaurateur" pour accéder à cette page.',
            });
            router.push('/profile-selection');
        }
    }, [user, authLoading, router, activeRole, toast]);

    const myRestaurantIds = React.useMemo(() => {
        if (!user || activeRole !== 'restaurateur') return [];
        return restaurants.map(r => r.id);
    }, [restaurants, user, activeRole]);

    const myMenuItems = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return menuItems.filter(item => myRestaurantIds.includes(item.restaurantId));
    }, [menuItems, myRestaurantIds]);

    if (authLoading || isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    const getRestaurantName = (restaurantId: string) => {
        return restaurants.find(r => r.id === restaurantId)?.name || 'Restaurant inconnu';
    };

    return (
        <div className="container mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <BookOpenCheck className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-headline text-primary">Gestion de Menu</h1>
                    <p className="text-muted-foreground">Visualisez et gérez tous les plats de vos restaurants.</p>
                </div>
            </div>

            {restaurants.length === 0 ? (
                 <Card className="max-w-lg mx-auto text-center p-8">
                    <CardHeader>
                        <CardTitle className="text-2xl">Commencez par créer un restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                           Pour ajouter des plats, vous devez d'abord enregistrer un établissement.
                        </CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer un restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : myMenuItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myMenuItems.map(item => (
                        <Card key={item.id} className="flex flex-col">
                            <CardHeader>
                                <div className="relative h-40 w-full rounded-lg overflow-hidden bg-muted">
                                    <Image
                                        src={`https://placehold.co/400x300.png`}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={item.imageHint}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <Badge variant="secondary" className="mb-2">{getRestaurantName(item.restaurantId)}</Badge>
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <CardDescription className="mt-1 h-12 overflow-hidden">{item.description}</CardDescription>
                                <p className="text-lg font-bold text-primary mt-3">{item.price.toLocaleString('fr-FR')} FCFA</p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button variant="outline" className="w-full" disabled>
                                    <Edit />
                                    Modifier
                                </Button>
                                <Button variant="destructive" className="w-full" disabled>
                                    <Trash2 />
                                    Supprimer
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center p-12">
                     <CardTitle className="text-2xl">Votre menu est vide</CardTitle>
                     <CardDescription className="mt-2 text-base">
                        Utilisez le créateur de plats par IA sur la page d'accueil de votre tableau de bord pour commencer à ajouter des plats.
                     </CardDescription>
                     <Button className="mt-6" asChild>
                        <Link href="/">Ajouter un plat</Link>
                     </Button>
                </Card>
            )}
        </div>
    );
}
