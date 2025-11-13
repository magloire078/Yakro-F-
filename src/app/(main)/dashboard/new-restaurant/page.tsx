
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
import { Loader, ChefHat, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

const restaurantFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  cuisine: z.string().min(3, { message: "Le type de cuisine doit contenir au moins 3 caractères." }),
  adresse: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
  tempsDeLivraison: z.coerce.number().min(5, { message: "Le temps de livraison doit être d'au moins 5 minutes."}),
  fraisDeLivraison: z.coerce.number().min(0, { message: "Les frais de livraison ne peuvent être négatifs."}),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export default function NewRestaurantPage() {
    const { addRestaurant } = useData();
    const { toast } = useToast();
    const router = useRouter();
    const { user, activeRole } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

     React.useEffect(() => {
        if (activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [activeRole, router]);

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
        if(!user) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer un restaurant.' });
            return;
        }
        setIsLoading(true);
        try {
            await addRestaurant(
                { ...data, proprietaireId: user.uid },
                imageFile
            );
            toast({
                title: 'Restaurant créé avec succès !',
                description: `${data.nom} a été ajouté à notre plateforme.`,
            });
            router.push('/dashboard/my-restaurants');
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
                            <CardDescription>Remplissez les informations ci-dessous pour ajouter votre établissement à Yakro Fê.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div>
                                <Label htmlFor="image-upload" className="cursor-pointer">
                                    Image du restaurant (recommandé)
                                    <div className="relative mt-2 w-full h-48 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50">
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Aperçu" fill className="object-cover rounded-md" />
                                        ) : (
                                        <div className="text-center">
                                            <Upload />
                                            <p>Cliquer pour choisir une image</p>
                                        </div>
                                        )}
                                    </div>
                                </Label>
                                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </div>
                            <FormField
                                control={form.control}
                                name="nom"
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
                                name="adresse"
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
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Latitude (Optionnel)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="any" placeholder="Ex: 6.8213" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Longitude (Optionnel)</FormLabel>
                                            <FormControl>
                                                 <Input type="number" step="any" placeholder="Ex: -5.2768" {...field} />
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
