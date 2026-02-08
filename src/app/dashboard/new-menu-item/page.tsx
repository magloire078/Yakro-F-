'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, Image as ImageIcon, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MenuItem, type Restaurant } from '@/lib/types';
import { generateMenuItem, type GenerateMenuItemOutput } from '@/ai/flows/generate-menu-item-flow';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MenuItemForm, menuItemFormSchema, type MenuItemFormValues } from '@/components/menu-item-form';
import { useFirebase } from '@/contexts/firebase-provider';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function NewMenuItemPage() {
    const { restaurants } = useData();
    const { db, storage } = useFirebase();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [generationError, setGenerationError] = React.useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const [description, setDescription] = React.useState('');
    const [imageFile, setImageFile] = React.useState<File | null>(null);

    const form = useForm<MenuItemFormValues>({
        resolver: zodResolver(menuItemFormSchema),
        defaultValues: {
            nom: '',
            description: '',
            prix: 0,
            accompagnementsDisponibles: [],
            boissonsDisponibles: [],
        },
    });
    
    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);
    
    React.useEffect(() => {
        if (myRestaurants.length > 0 && !selectedRestaurant) {
            setSelectedRestaurant(myRestaurants[0]);
        }
    }, [myRestaurants, selectedRestaurant]);

    const handleGenerateItem = async () => {
        if (!selectedRestaurant || !description) {
            toast({ variant: 'destructive', title: 'Informations manquantes' });
            return;
        }
        setLoading(true);
        setGenerationError(false);
        try {
            const itemDetails: GenerateMenuItemOutput = await generateMenuItem({
                restaurantName: selectedRestaurant.nom,
                cuisine: selectedRestaurant.cuisine,
                description: description,
            });

            form.reset({
                nom: itemDetails.nom,
                description: itemDetails.description,
                prix: itemDetails.prix,
                indiceImage: itemDetails.indiceImage,
                accompagnementsDisponibles: [],
                boissonsDisponibles: [],
            });
        } catch (error) {
            setGenerationError(true);
            toast({ variant: 'destructive', title: 'Erreur de génération' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemToMenu = async (data: MenuItemFormValues, file: File | null) => {
        if (!selectedRestaurant || !user) return;

        setLoading(true);
        const itemRef = doc(collection(db, "plats"));
        const itemId = itemRef.id;

        const itemData: Omit<MenuItem, 'id'> = {
            nom: data.nom,
            description: data.description,
            prix: data.prix,
            indiceImage: data.indiceImage || `${data.nom} ${selectedRestaurant.cuisine}`,
            restaurantId: selectedRestaurant.id,
            accompagnementsDisponibles: data.accompagnementsDisponibles,
            boissonsDisponibles: data.boissonsDisponibles,
            image: ''
        };

        try {
            await setDoc(itemRef, itemData).catch(e => {
                const permissionError = new FirestorePermissionError({
                    path: itemRef.path,
                    operation: 'create',
                    requestResourceData: itemData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw e;
            });

            if (file) {
                const storageRef = ref(storage, `plats/${itemId}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                await updateDoc(itemRef, { image: downloadURL });
            }

            toast({ title: 'Plat ajouté !' });
            router.push('/dashboard/menu');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur lors de l\'ajout' });
        } finally {
            setLoading(false);
        }
    };

    if (myRestaurants.length === 0) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Card className="max-w-lg text-center p-8">
                    <CardHeader>
                        <ChefHat className="h-16 w-16 mx-auto text-primary" />
                        <CardTitle className="text-2xl mt-4">Aucun restaurant trouvé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Vous devez enregistrer un restaurant avant d'ajouter des plats.</CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer mon restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    const isGenerated = !!form.getValues('nom');

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-headline text-[#4F46E5] mb-8">Créateur de Plats IA</h1>
            
            <div className="flex flex-col gap-10">
                {/* Step 1: Input */}
                <Card className="border-none shadow-sm bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">1. Décrivez votre plat</CardTitle>
                        <CardDescription className="text-sm">L'IA s'occupe de créer un nom alléchant et un prix juste.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Restaurant:</Label>
                            <Select
                                onValueChange={value => setSelectedRestaurant(myRestaurants.find(r => r.id === value) || null)}
                                value={selectedRestaurant?.id || ''}
                            >
                                <SelectTrigger className="w-full bg-background border-border rounded-xl">
                                    <SelectValue placeholder="Choisir un établissement" />
                                </SelectTrigger>
                                <SelectContent>
                                    {myRestaurants.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">Description simple:</Label>
                            <Textarea
                                id="description"
                                placeholder="Poulet braisé avec Attiéké"
                                className="min-h-[100px] bg-background border-border resize-none rounded-xl"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        
                        <Button 
                            onClick={handleGenerateItem} 
                            disabled={loading || !description} 
                            className="w-full py-6 text-lg font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-colors shadow-md rounded-xl"
                        >
                            {loading ? (
                                <Loader className="animate-spin mr-2 h-5 w-5" />
                            ) : (
                                <Wand2 className="mr-2 h-5 w-5" />
                            )}
                            {loading ? 'Génération en cours...' : 'Générer avec l\'IA'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Step 2: Preview */}
                <Card className="relative border-2 border-dashed border-border shadow-none bg-transparent rounded-2xl">
                    {generationError && (
                        <div className="absolute top-4 right-4 bg-[#EF4444] text-white px-6 py-3 rounded-xl shadow-2xl z-20 font-bold text-center animate-in zoom-in-95 duration-200">
                            Erreur de<br />génération
                        </div>
                    )}
                    
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">2. Aperçu et Validation</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                        {isGenerated ? (
                            <div className="w-full">
                                <MenuItemForm
                                    form={form}
                                    onSubmit={handleAddItemToMenu}
                                    isLoading={loading}
                                    imageFile={imageFile}
                                    onImageChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setImageFile(file);
                                    }}
                                >
                                    <div className="mt-8 flex justify-end gap-3 w-full">
                                        <Button variant="ghost" type="button" onClick={() => {
                                            form.reset();
                                            setGenerationError(false);
                                        }}>Effacer</Button>
                                        <Button type="submit" disabled={loading} className="px-10 py-6 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5]">
                                            {loading ? <Loader className="animate-spin mr-2" /> : null}
                                            Ajouter au menu
                                        </Button>
                                    </div>
                                </MenuItemForm>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground space-y-6">
                                <div className="p-6 bg-muted/20 rounded-2xl w-fit mx-auto">
                                    <ImageIcon className="h-16 w-16 opacity-30" />
                                </div>
                                <p className="text-base font-medium max-w-[200px] mx-auto opacity-60">
                                    Le plat apparaîtra ici après génération.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}