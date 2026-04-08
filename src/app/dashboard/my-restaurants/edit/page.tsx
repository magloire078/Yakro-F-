
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, ChefHat, ArrowLeft } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import Link from 'next/link';
import { RestaurantForm, type RestaurantFormValues } from '@/components/restaurant-form';
import { doc, updateDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard/my-restaurants">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à mes restaurants
                </Link>
            </Button>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ChefHat className="h-8 w-8 text-primary" />
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

export default function EditRestaurantPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>}>
            <EditRestaurantContent />
        </React.Suspense>
    );
}
