'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, UtensilsCrossed, Edit, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import type { Restaurant } from '@/lib/types';
import Link from 'next/link';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default function MyRestaurantsPage() {
    const { user, activeRole } = useAuth();
    const { restaurants } = useData();
    const router = useRouter();

    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, activeRole, router]);

    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <UtensilsCrossed className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-headline text-primary">Mes Restaurants</h1>
                        <p className="text-muted-foreground">Gérez vos établissements ici.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/dashboard/new-restaurant">
                        <PlusCircle />
                        Ajouter un restaurant
                    </Link>
                </Button>
            </div>

            {myRestaurants.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRestaurants.map(restaurant => {
                        const placeholder = getPlaceholderImage(restaurant.indiceImage);
                        const imageSrc = (restaurant.image && restaurant.image !== "" && !restaurant.image.includes('picsum.photos'))
                            ? restaurant.image
                            : placeholder.url;
                        return (
                            <Card key={restaurant.id} className="flex flex-col">
                                <CardHeader className="p-0">
                                    <div className="relative h-40 w-full rounded-t-lg overflow-hidden bg-muted">
                                        <Image
                                            src={imageSrc}
                                            alt={restaurant.nom}
                                            width={placeholder.width}
                                            height={placeholder.height}
                                            className="object-cover w-full h-full"
                                            data-ai-hint={restaurant.indiceImage}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow flex flex-col">
                                    <CardTitle className="font-headline text-xl">{restaurant.nom}</CardTitle>
                                    <CardDescription className="mt-1">{restaurant.cuisine}</CardDescription>
                                    <div className="flex-grow" />
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="default" asChild>
                                            <Link href={`/dashboard/my-restaurants/${restaurant.id}/edit`}>
                                                <Edit />
                                                Modifier
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                 </div>
            ) : (
                <Card className="max-w-lg mx-auto text-center p-8 mt-16">
                    <CardHeader>
                        <CardTitle className="text-2xl">Aucun restaurant trouvé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                           Commencez par ajouter votre premier établissement pour le voir apparaître ici.
                        </CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer un restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}