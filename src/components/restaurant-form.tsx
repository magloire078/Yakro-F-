
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader, Upload, MapPin, ChefHat } from 'lucide-react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPlaceholderImage } from '@/lib/placeholder-images';

const restaurantFormSchema = z.object({
    nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
    cuisine: z.string().min(3, { message: "Le type de cuisine doit contenir au moins 3 caractères." }),
    adresse: z.string().min(10, { message: "L'adresse doit contenir au moins 10 caractères." }),
    tempsDeLivraison: z.coerce.number().min(5, { message: "Le temps de livraison doit être d'au moins 5 minutes." }),
    fraisDeLivraison: z.coerce.number().min(0, { message: "Les frais de livraison ne peuvent être négatifs." }),
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
            indiceImage: '',
        },
    });

    React.useEffect(() => {
        if (initialData) {
            form.reset(initialData);
            const placeholder = getPlaceholderImage(initialData.indiceImage);
            const imageSrc = (initialData.image && !initialData.image.includes('picsum.photos'))
                ? initialData.image
                : placeholder.url;
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
            () => {
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
                {/* Image Upload Section */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                        Identité Visuelle
                    </Label>
                    <Label htmlFor="image-upload" className="cursor-pointer group block">
                        <div className="relative w-full h-64 overflow-hidden bg-[#0A0A0B] border border-white/5 transition-all duration-500 group-hover:border-orange-500/30 flex items-center justify-center">
                            {imagePreview ? (
                                <>
                                    {imagePreview.includes('res.cloudinary.com') ? (
                                        <CldImage
                                            src={imagePreview}
                                            alt="Aperçu"
                                            fill
                                            crop="fill"
                                            gravity="auto"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Image 
                                            src={imagePreview} 
                                            alt="Aperçu" 
                                            fill 
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105" 
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-white" />
                                            <span className="text-white font-bold uppercase tracking-tighter text-xs">Changer l&apos;image</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8 space-y-4">
                                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/5 border border-white/10 mb-2">
                                        <Upload className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black italic uppercase tracking-tighter text-lg">Sélectionner une Image</p>
                                        <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Format recommandé: 16:9</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Label>
                    <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nom de l&apos;établissement</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Ex: Le Palais de la Savane" 
                                        {...field} 
                                        className="h-14 bg-white/5 border-white/10 rounded-none focus-visible:ring-orange-500 focus-visible:border-orange-500 text-white font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cuisine"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Type de Cuisine</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Ex: Ivoirienne Moderne, Grillades" 
                                        {...field} 
                                        className="h-14 bg-white/5 border-white/10 rounded-none focus-visible:ring-orange-500 focus-visible:border-orange-500 text-white font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Localisation Précise</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: Yamoussoukro, Quartier 2000, Axe Royal" 
                                    {...field} 
                                    className="h-14 bg-white/5 border-white/10 rounded-none focus-visible:ring-orange-500 focus-visible:border-orange-500 text-white font-medium transition-all"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tempsDeLivraison"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Délai Estime (min)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        {...field} 
                                        className="h-14 bg-white/5 border-white/10 rounded-none focus-visible:ring-orange-500 focus-visible:border-orange-500 text-white font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fraisDeLivraison"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Service Fee (FCFA)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        {...field} 
                                        className="h-14 bg-white/5 border-white/10 rounded-none focus-visible:ring-orange-500 focus-visible:border-orange-500 text-white font-medium transition-all"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center gap-4">
                        <div>
                            <h4 className="text-white font-black italic uppercase tracking-tighter text-lg leading-tight">Géolocalisation</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Précision stratégique pour les livreurs</p>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleGetLocation} 
                            disabled={isFetchingLocation}
                            className="rounded-none border-white/10 bg-white/5 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all font-bold uppercase tracking-tighter text-[10px] h-12"
                        >
                            {isFetchingLocation ? <Loader className="animate-spin h-4 w-4" /> : <MapPin className="h-4 w-4 mr-2" />}
                            Auto-Détection
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Latitude</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder="6.8213" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            className="h-12 bg-[#0A0A0B] border-white/5 rounded-none text-gray-400 font-mono text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Longitude</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder="-5.2768" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            className="h-12 bg-[#0A0A0B] border-white/5 rounded-none text-gray-400 font-mono text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-black italic uppercase tracking-tighter text-xl rounded-none shadow-2xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isLoading ? (
                        <Loader className="mr-3 h-6 w-6 animate-spin" />
                    ) : (
                        <ChefHat className="mr-3 h-6 w-6" />
                    )}
                    {submitButtonText}
                </Button>
            </form>
        </Form>
    );
}
