'use client';

import * as React from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { RestaurantForm, type RestaurantFormValues } from '@/components/restaurant-form';
import type { Restaurant } from '@/lib/types';
import { collection, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { MobileBackButton } from '@/components/mobile-back-button';
import { motion } from 'framer-motion';
import { generateImageAction } from '@/app/actions/ai-actions';

const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing.");
    }

    const formData = new FormData();
    formData.append('file', fileOrDataUrl);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', path);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
};

export default function NewRestaurantPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const { db } = useFirebase();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);

    const onSubmit = async (data: RestaurantFormValues, imageFile: File | null) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer un restaurant.' });
            return;
        }
        setIsLoading(true);

        const restaurantRef = doc(collection(db, "restaurants"));
        const restaurantId = restaurantRef.id;

        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
            }

            const restaurantData: Restaurant = {
                ...data,
                id: restaurantId,
                proprietaireId: user.uid,
                note: 4.0, // Note par défaut
                enVedette: false,
                image: imageUrl,
                indiceImage: data.indiceImage || `${data.cuisine} restaurant`,
                latitude: data.latitude || 6.82,
                longitude: data.longitude || -5.28,
            };

            // Write directly to Firestore via client SDK
            await setDoc(restaurantRef, restaurantData).catch(e => {
                const permissionError = new FirestorePermissionError({
                    path: restaurantRef.path,
                    operation: 'create',
                    requestResourceData: restaurantData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw e;
            });

            toast({
                title: 'Restaurant créé avec succès !',
                description: `${data.nom} a été ajouté à Yakro Fê.`,
            });
            router.push('/dashboard/my-restaurants');
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de créer le restaurant. Vérifiez vos permissions.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleGenerateImage = async () => {
        const nom = (document.querySelector('input[name="nom"]') as HTMLInputElement)?.value;
        const cuisine = (document.querySelector('input[name="cuisine"]') as HTMLInputElement)?.value;
        
        if (!nom) {
            toast({ variant: 'destructive', title: 'Données Insuffisantes', description: 'Veuillez saisir le nom du restaurant pour générer un visuel.' });
            return;
        }

        setIsGeneratingImage(true);
        try {
            const prompt = `restaurant ${nom} ${cuisine || ''}`;
            const result = await generateImageAction({ prompt });
            if (!result.success) throw new Error(result.error);
            
            setGeneratedImageUrl(result.data.imageDataUri);
            toast({ title: 'Visuel Généré', description: 'Le visuel premium a été matérialisé avec succès.' });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Échec', description: 'Impossible de générer le visuel IA.' });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-white pb-20">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
                    alt="Culinary Background"
                    fill
                    className="object-cover opacity-10 scale-110 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
            </div>

            <div className="relative z-10 container mx-auto pt-10 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Mobile Navigation */}
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Restaurants" href="/dashboard/my-restaurants" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-12 pt-16 md:pt-0">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-6"
                        >
                            <ChefHat className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Partenariat d&apos;Élite</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 mb-4 leading-none"
                        >
                            Érigez votre <span className="text-orange-500">Empire</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 font-medium max-w-md mx-auto text-sm md:text-base italic uppercase tracking-widest"
                        >
                            Rejoignez le cercle exclusif des restaurateurs Yakro Go et redéfinissez la gastronomie locale.
                        </motion.p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 md:p-12 shadow-2xl relative overflow-hidden rounded-3xl">
                        <div className="absolute top-0 left-0 w-[2px] h-full bg-orange-500" />
                        
                        <div className="relative z-10">
                            <RestaurantForm
                                onSubmit={onSubmit}
                                isLoading={isLoading}
                                isGeneratingImage={isGeneratingImage}
                                onGenerateImage={handleGenerateImage}
                                generatedImage={generatedImageUrl}
                                submitButtonText="Inaugurer l'Établissement"
                            />
                        </div>

                        {/* Decorative Element */}
                        <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-orange-500/5 rounded-full blur-3xl" />
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Propulsé par la Technologie Yakro Intelligence
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
