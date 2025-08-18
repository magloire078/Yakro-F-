
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader, Rocket, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function BoostPage() {
    const { user, loading: authLoading, activeRole } = useAuth();
    const { restaurants, updateRestaurant, isLoading } = useData();
    const { toast } = useToast();
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);
    const router = useRouter();

    const myRestaurants = React.useMemo(() => {
        if (!user || activeRole !== 'restaurateur') return [];
        return restaurants.filter(r => r.ownerId === user.uid);
    }, [restaurants, user, activeRole]);

     React.useEffect(() => {
        if (!authLoading && user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, authLoading, activeRole, router]);
    
    const handleBoostToggle = async (restaurant: Restaurant) => {
        setUpdatingId(restaurant.id);
        const newStatus = !restaurant.isFeatured;
        try {
            await updateRestaurant(restaurant.id, { isFeatured: newStatus });
            toast({
                title: 'Mise à jour réussie !',
                description: `${restaurant.name} est maintenant ${newStatus ? 'en vedette' : 'standard'}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de mettre à jour le statut du restaurant.',
            });
        } finally {
            setUpdatingId(null);
        }
    };
    
    if (isLoading || authLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Rocket className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-headline text-primary">Booster la Visibilité</h1>
                    <p className="text-muted-foreground">Mettez vos restaurants en vedette pour attirer plus de clients.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                {myRestaurants.length > 0 ? (
                    myRestaurants.map(restaurant => (
                        <Card key={restaurant.id} className="shadow-md">
                            <CardHeader>
                                <CardTitle>{restaurant.name}</CardTitle>
                                <CardDescription>{restaurant.address}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <Label htmlFor={`boost-${restaurant.id}`} className="flex flex-col space-y-1">
                                        <span className="font-semibold">Mettre en vedette</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                           Votre restaurant apparaîtra en haut des résultats.
                                        </span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        {updatingId === restaurant.id && <Loader className="animate-spin" />}
                                        <Switch
                                            id={`boost-${restaurant.id}`}
                                            checked={restaurant.isFeatured || false}
                                            onCheckedChange={() => handleBoostToggle(restaurant)}
                                            disabled={updatingId === restaurant.id}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="text-center p-12">
                         <CardTitle className="text-2xl">Aucun restaurant trouvé</CardTitle>
                         <CardDescription className="mt-2 text-base">
                            Vous devez d'abord créer un restaurant avant de pouvoir booster sa visibilité.
                         </CardDescription>
                    </Card>
                )}

                 <Card className="bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground">
                    <CardContent className="p-6 flex items-center gap-6">
                        <PartyPopper className="h-12 w-12 shrink-0"/>
                        <div>
                            <h3 className="font-bold text-lg">Comment ça marche ?</h3>
                            <p className="opacity-90">
                                Activer la mise en vedette est un service payant (facturation simulée pour ce prototype). 
                                Les restaurants en vedette sont montrés en priorité aux clients, ce qui augmente vos chances de recevoir des commandes.
                            </p>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
