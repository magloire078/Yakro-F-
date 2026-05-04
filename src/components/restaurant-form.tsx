
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
import { Loader, Upload, MapPin, ChefHat, Wand2 } from 'lucide-react';
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
    isGeneratingImage?: boolean;
    onGenerateImage?: () => Promise<void>;
    submitButtonText: string;
    generatedImage?: string | null;
}

export function RestaurantForm({ onSubmit, initialData, isLoading, isGeneratingImage, onGenerateImage, submitButtonText, generatedImage }: RestaurantFormProps) {
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
    
    // Handle external image generation
    React.useEffect(() => {
        if (generatedImage) {
            setImagePreview(generatedImage);
            form.setValue('image', generatedImage);
            // Also set a descriptive alt for the generated image if possible
            const nom = form.getValues('nom');
            if (nom) {
                form.setValue('indiceImage', `${nom} restaurant premium cinematic`);
            }
        }
    }, [generatedImage, form]);

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
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Identité Visuelle
                        </Label>
                        {onGenerateImage && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onGenerateImage}
                                disabled={isGeneratingImage || isLoading}
                                className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 hover:bg-orange-500/5 gap-2"
                            >
                                {isGeneratingImage ? <Loader className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                {isGeneratingImage ? 'Matérialisation...' : 'Générer avec IA'}
                            </Button>
                        )}
                    </div>
                    <Label htmlFor="image-upload" className="cursor-pointer group block">
                        <div className="relative w-full h-64 overflow-hidden bg-slate-50 border border-slate-200/60 rounded-2xl transition-all duration-500 group-hover:border-orange-500/50 flex items-center justify-center shadow-sm">
                            {isGeneratingImage ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
                                        <Loader className="h-12 w-12 text-orange-500 animate-spin relative z-10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 animate-pulse">Consultation de la Matrice...</p>
                                </div>
                            ) : imagePreview ? (
                                <>
                                    {imagePreview.includes('res.cloudinary.com') ? (
                                        <CldImage
                                            src={imagePreview}
                                            alt="Aperçu"
                                            fill
                                            crop="fill"
                                            gravity="auto"
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Image 
                                            src={imagePreview} 
                                            alt="Aperçu" 
                                            fill 
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-white" />
                                            <span className="text-white font-black uppercase tracking-widest text-[10px]">Changer l&apos;Image</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8 space-y-4">
                                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white border border-slate-100 mb-2 group-hover:scale-110 transition-transform duration-500">
                                        <Upload className="h-8 w-8 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-black italic uppercase tracking-tighter text-xl leading-none">Sélectionner une Image</p>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Format recommandé: 16:9</p>
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nom de l&apos;établissement</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Ex: Le Palais de la Savane" 
                                        {...field} 
                                        className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm"
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Type de Cuisine</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Ex: Ivoirienne Moderne, Grillades" 
                                        {...field} 
                                        className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm"
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Localisation Précise</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: Yamoussoukro, Quartier 2000, Axe Royal" 
                                    {...field} 
                                    className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm"
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Délai Estime (min)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        {...field} 
                                        className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm"
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Service Fee (FCFA)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        {...field} 
                                        className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-6 pt-10 border-t border-slate-100">
                    <div className="flex justify-between items-center gap-4">
                        <div>
                            <h4 className="text-slate-900 font-black italic uppercase tracking-tighter text-xl leading-tight">Géolocalisation</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">Précision stratégique pour les livreurs</p>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleGetLocation} 
                            disabled={isFetchingLocation}
                            className="rounded-xl border-slate-200 bg-white hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-300 font-black uppercase tracking-tighter text-[11px] h-12 px-6 shadow-sm"
                        >
                            {isFetchingLocation ? <Loader className="animate-spin h-4 w-4" /> : <MapPin className="h-4 w-4 mr-2" />}
                            Auto-Détection
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Latitude</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder="6.8213" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            className="h-12 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-mono text-xs focus-visible:ring-orange-500 shadow-inner"
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
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Longitude</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            placeholder="-5.2768" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            className="h-12 bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-mono text-xs focus-visible:ring-orange-500 shadow-inner"
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
                    className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-black italic uppercase tracking-tighter text-xl rounded-2xl shadow-[0_20px_40px_rgba(249,115,22,0.2)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
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
