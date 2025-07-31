
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader, ChefHat } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

const restaurantFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  cuisine: z.string().min(3, { message: "Le type de cuisine doit contenir au moins 3 caractères." }),
  address: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
  deliveryTime: z.coerce.number().min(5, { message: "Le temps de livraison doit être d'au moins 5 minutes."}),
  deliveryFee: z.coerce.number().min(0, { message: "Les frais de livraison ne peuvent être négatifs."}),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export default function NewRestaurantPage() {
    const { addRestaurant } = useData();
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<RestaurantFormValues>({
        resolver: zodResolver(restaurantFormSchema),
        defaultValues: {
            name: '',
            cuisine: '',
            address: '',
            deliveryTime: 30,
            deliveryFee: 1000,
        },
    });

    const onSubmit = async (data: RestaurantFormValues) => {
        if(!user) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer un restaurant.' });
            return;
        }
        setIsLoading(true);
        try {
            const newRestaurant: Omit<Restaurant, 'id'> = {
                ...data,
                ownerId: user.uid,
                // These are default values for a new restaurant
                rating: 0,
                image: `https://placehold.co/600x400.png`,
                imageHint: `${data.cuisine} restaurant`,
            };
            await addRestaurant(newRestaurant);
            toast({
                title: 'Restaurant créé avec succès !',
                description: `${data.name} a été ajouté à notre plateforme.`,
            });
            router.push('/');
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de créer le restaurant pour le moment.'
            });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="container mx-auto">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ChefHat className="h-8 w-8 text-primary"/>
                        <div>
                            <CardTitle className="text-2xl">Enregistrer votre restaurant</CardTitle>
                            <CardDescription>Remplissez les informations ci-dessous pour ajouter votre établissement à Yakro Go.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom du restaurant</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Chez Maman" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="cuisine"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type de cuisine</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Ivoirienne, Grillades, Pizzeria" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Soyez simple et descriptif.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse de récupération</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Yamoussoukro, Quartier 2000, près de la pharmacie" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="deliveryTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Temps de livraison (min)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="deliveryFee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Frais de livraison (FCFA)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer mon restaurant
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
