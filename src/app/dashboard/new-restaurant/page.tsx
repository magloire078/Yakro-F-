'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ChefHat, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { RestaurantForm, type RestaurantFormValues } from '@/components/restaurant-form';
import type { Restaurant } from '@/lib/types';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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

    const onSubmit = async (data: RestaurantFormValues, imageFile: File | null) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer un restaurant.' });
            return;
        }
        setIsLoading(true);

        const restaurantRef = doc(collection(db, "restaurants"));
        const restaurantId = restaurantRef.id;

        const restaurantData: Omit<Restaurant, 'id'> = {
            ...data,
            proprietaireId: user.uid,
            note: 4.0, // Note par défaut
            enVedette: false,
            image: '',
            indiceImage: data.indiceImage || `${data.cuisine} restaurant`,
            latitude: data.latitude || 6.82,
            longitude: data.longitude || -5.28,
        };

        try {
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

            if (imageFile) {
                const imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}`);
                await updateDoc(restaurantRef, { image: imageUrl });
            }

            toast({
                title: 'Restaurant créé avec succès !',
                description: `${data.nom} a été ajouté à Yakro Fê.`,
            });
            router.push('/dashboard/my-restaurants');
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de créer le restaurant. Vérifiez vos permissions.'
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
                            <ChefHat className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Enregistrer votre restaurant</CardTitle>
                                <CardDescription>Ajoutez votre établissement pour commencer à recevoir des commandes.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <RestaurantForm
                            onSubmit={onSubmit}
                            isLoading={isLoading}
                            submitButtonText="Enregistrer mon restaurant"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
