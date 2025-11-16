

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { Loader, ChefHat, ArrowLeft } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { RestaurantForm, type RestaurantFormValues } from '@/components/restaurant-form';

export default function EditRestaurantPage() {
    const { getRestaurant, updateRestaurant } = useData();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const restaurantId = params.id as string;
    
    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);

    React.useEffect(() => {
        const r = getRestaurant(restaurantId);
        if (r) {
            if (r.proprietaireId !== user?.uid) {
                toast({ variant: 'destructive', title: 'Accès non autorisé' });
                router.push('/');
                return;
            }
            setRestaurant(r);
        }
    }, [restaurantId, getRestaurant, user, router, toast]);

    const onSubmit = async (data: RestaurantFormValues, imageFile: File | null) => {
        if(!user || !restaurant) return;
        setIsLoading(true);
        try {
            await updateRestaurant(restaurant.id, data, imageFile);
            toast({
                title: 'Restaurant mis à jour !',
                description: 'Vos modifications ont été enregistrées.',
            });
            router.push('/dashboard/my-restaurants');
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de mettre à jour le restaurant.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!restaurant) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

  return (
    <div className="container mx-auto">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/my-restaurants">
                <ArrowLeft />
                Retour à mes restaurants
            </Link>
        </Button>
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ChefHat className="h-8 w-8 text-primary"/>
                        <div>
                            <CardTitle className="text-2xl">Modifier "{restaurant.nom}"</CardTitle>
                            <CardDescription>Mettez à jour les informations de votre établissement.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <RestaurantForm 
                        onSubmit={onSubmit} 
                        initialData={restaurant} 
                        isLoading={isLoading} 
                        submitButtonText="Enregistrer les modifications"
                    />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
