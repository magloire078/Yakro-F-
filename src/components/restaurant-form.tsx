
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
import { Loader, Upload, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPlaceholderImage } from '@/lib/placeholder-images';

const restaurantFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  cuisine: z.string().min(3, { message: "Le type de cuisine doit contenir au moins 3 caractères." }),
  adresse: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
  tempsDeLivraison: z.coerce.number().min(5, { message: "Le temps de livraison doit être d'au moins 5 minutes."}),
  fraisDeLivraison: z.coerce.number().min(0, { message: "Les frais de livraison ne peuvent être négatifs."}),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  image: z.string().optional(),
  indiceImage: z.string().optional(),
});

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

interface RestaurantFormProps {
    onSubmit: (data: RestaurantFormValues, imageFile: File | null) => Promise<void>;
    initialData?: Partial<RestaurantFormValues>;
    isLoading: boolean;
    submitButtonText: string;
}

export function RestaurantForm({ onSubmit, initialData, isLoading, submitButtonText }: RestaurantFormProps) {
    const { toast } = useToast();
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);

    const form = useForm<RestaurantFormValues>({
        resolver: zodResolver(restaurantFormSchema),
        defaultValues: initialData || {
            nom: '',
            cuisine: '',
            adresse: '',
            tempsDeLivraison: 30,
            fraisDeLivraison: 1000,
        },
    });

    React.useEffect(() => {
        if (initialData) {
            form.reset(initialData);
            const imageSrc = (initialData.image && !initialData.image.includes('placehold.co'))
                ? initialData.image
                : getPlaceholderImage(initialData.indiceImage, 600, 400);
            setImagePreview(imageSrc);
        }
    }, [initialData, form]);

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
    
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({
                variant: 'destructive',
                title: 'Géolocalisation non supportée',
                description: "Votre navigateur ne permet pas de récupérer votre position.",
            });
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                form.setValue('latitude', parseFloat(latitude.toFixed(6)));
                form.setValue('longitude', parseFloat(longitude.toFixed(6)));
                toast({
                    title: 'Position récupérée !',
                    description: 'Les coordonnées GPS ont été ajoutées au formulaire.',
                });
                setIsFetchingLocation(false);
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Erreur de géolocalisation',
                    description: "Impossible de récupérer votre position. Veuillez vérifier les autorisations de votre navigateur.",
                });
                setIsFetchingLocation(false);
            }
        );
    };

    const handleFormSubmit = (data: RestaurantFormValues) => {
        onSubmit(data, imageFile);
    }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
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
            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-medium">Géolocalisation</h4>
                        <p className="text-sm text-muted-foreground">Optionnel, mais recommandé pour les livreurs.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? <Loader className="animate-spin" /> : <MapPin />}
                        Obtenir la position GPS
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" placeholder="Ex: 6.8213" {...field} value={field.value ?? ''} />
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
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                        <Input type="number" step="any" placeholder="Ex: -5.2768" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonText}
            </Button>
        </form>
    </Form>
  );
}
