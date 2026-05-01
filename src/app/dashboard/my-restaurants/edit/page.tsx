
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, ChefHat } from 'lucide-react';
import { MobileBackButton } from '@/components/mobile-back-button';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import Link from 'next/link';
import { RestaurantForm, type RestaurantFormValues } from '@/components/restaurant-form';
import { doc, updateDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { uploadImage } from '@/lib/cloudinary';

function EditRestaurantContent() {
    const { getRestaurant } = useData();
    const { db } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const restaurantId = searchParams.get('id');

    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);

    React.useEffect(() => {
        if (!restaurantId || !user) return;

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
        if (!user || !restaurant || !restaurantId) return;
        setIsLoading(true);

        const restaurantDocRef = doc(db, 'restaurants', restaurantId);
        const updateData: Partial<Restaurant> = { ...data };

        try {
            if (imageFile) {
                const imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
                updateData.image = imageUrl;
            }

            await updateDoc(restaurantDocRef, updateData).catch(e => {
                const permissionError = new FirestorePermissionError({
                    path: restaurantDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw e;
            });

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

    if (!restaurantId) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <p>Identifiant de restaurant manquant.</p>
                <Button asChild>
                    <Link href="/dashboard/my-restaurants">Retour à mes restaurants</Link>
                </Button>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0A0A0B] pb-20">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop"
                    alt="Kitchen Background"
                    fill
                    className="object-cover opacity-20 scale-110 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            </div>

            <div className="relative z-10 container mx-auto pt-10 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Mobile Navigation */}
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Restaurants" href="/dashboard/my-restaurants" />
                    </div>

                    {/* Back Navigation (Desktop) */}
                    <Link 
                        href="/dashboard/my-restaurants" 
                        className="hidden md:inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors font-bold uppercase tracking-widest text-[10px] mb-8 group"
                    >
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        Retour à la Flotte
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-12 pt-16 md:pt-0">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-6"
                        >
                            <ChefHat className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Optimisation d&apos;Établissement</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none"
                        >
                            Raffiner <span className="text-orange-500">{restaurant.nom}</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 font-medium max-w-md mx-auto text-sm md:text-base italic uppercase tracking-widest"
                        >
                            Perfectionnez les détails de votre signature gastronomique pour une expérience client inégalée.
                        </motion.p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                        
                        <div className="relative z-10">
                            <RestaurantForm
                                onSubmit={onSubmit}
                                initialData={restaurant}
                                isLoading={isLoading}
                                submitButtonText="Actualiser mon Prestige"
                            />
                        </div>

                        {/* Decorative Element */}
                        <div className="absolute -top-20 -left-20 h-64 w-64 bg-orange-500/5 rounded-full blur-3xl" />
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                            Certifié Yakro Elite Standards
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EditRestaurantPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-orange-500" />
            </div>
        }>
            <EditRestaurantContent />
        </React.Suspense>
    );
}
