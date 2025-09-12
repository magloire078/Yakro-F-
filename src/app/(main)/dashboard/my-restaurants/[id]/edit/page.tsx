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
import { useRouter, useParams } from 'next/navigation';
import { Loader, ChefHat, Upload, ArrowLeft } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const restaurantFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  cuisine: z.string().min(3, { message: "Le type de cuisine doit contenir au moins 3 caractères." }),
  adresse: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
  tempsDeLivraison: z.coerce.number().min(5, { message: "Le temps de livraison doit être d'au moins 5 minutes."}),
  fraisDeLivraison: z.coerce.number().min(0, { message: "Les frais de livraison ne peuvent être négatifs."}),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export default function EditRestaurantPage() {
    const { getRestaurant, updateRestaurant } = useData();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const restaurantId = params.id as string;
    
    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

    const form = useForm<RestaurantFormValues>({
        resolver: zodResolver(restaurantFormSchema),
        defaultValues: {
            nom: '',
            cuisine: '',
            adresse: '',
            tempsDeLivraison: 30,
            fraisDeLivraison: 1000,
        },
    });
    
    React.useEffect(() => {
        const r = getRestaurant(restaurantId);
        if (r) {
            if (r.proprietaireId !== user?.uid) {
                toast({ variant: 'destructive', title: 'Accès non autorisé' });
                router.push('/');
                return;
            }
            setRestaurant(r);
            form.reset(r);
            setImagePreview(r.image);
        }
    }, [restaurantId, getRestaurant, user, router, toast, form]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const onSubmit = async (data: RestaurantFormValues) => {
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
        return <div className="flex h-screen w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                             <div>
                                <Label htmlFor="image-upload-edit" className="cursor-pointer">
                                    Image du restaurant
                                    <div className="relative mt-2 w-full h-48 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50">
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Aperçu" fill className="object-cover rounded-md" />
                                        ) : (
                                        <div className="text-center">
                                            <Upload />
                                            <p>Changer l'image</p>
                                        </div>
                                        )}
                                    </div>
                                </Label>
                                <Input id="image-upload-edit" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </div>

                            <FormField
                                control={form.control}
                                name="nom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom du restaurant</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="adresse"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse de récupération</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tempsDeLivraison"
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
                                    name="fraisDeLivraison"
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
                                Enregistrer les modifications
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
