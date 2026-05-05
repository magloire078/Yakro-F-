'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/data-context';
import { Loader, ChefHat, Plus, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MenuItem, type Restaurant } from '@/lib/types';
import { uploadImage } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MenuItemForm, menuItemFormSchema, type MenuItemFormValues } from '@/components/menu-item-form';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { DashboardPage } from '@/components/dashboard/dashboard-page';

export default function NewMenuItemPage() {
    const { restaurants } = useData();
    const { db } = useFirebase();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const [imageFile, setImageFile] = React.useState<File | null>(null);

    const form = useForm<MenuItemFormValues>({
        resolver: zodResolver(menuItemFormSchema),
        defaultValues: {
            nom: '',
            description: '',
            prix: 0,
            categorie: 'Plats',
            accompagnementsDisponibles: [],
            boissonsDisponibles: [],
            ingredients: [],
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

    const handleAddItemToMenu = async (data: MenuItemFormValues, file: File | null) => {
        if (!selectedRestaurant || !user) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un établissement.' });
            return;
        }

        setLoading(true);
        const itemRef = doc(collection(db, "plats"));
        const itemId = itemRef.id;

        const itemData: Omit<MenuItem, 'id'> = {
            nom: data.nom,
            description: data.description,
            prix: data.prix,
            categorie: data.categorie,
            indiceImage: data.indiceImage || `${data.nom} ${selectedRestaurant.cuisine}`,
            restaurantId: selectedRestaurant.id,
            accompagnementsDisponibles: data.accompagnementsDisponibles || [],
            boissonsDisponibles: data.boissonsDisponibles || [],
            ingredients: data.ingredients || [],
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

            const imageToUpload = file || (data.image?.startsWith('data:') ? data.image : null);

            if (imageToUpload) {
                const imageUrl = await uploadImage(imageToUpload, `plats/${itemId}`);
                await updateDoc(itemRef, { image: imageUrl });
            }

            toast({ title: 'Plat ajouté', description: 'Votre plat a été enregistré avec succès.' });
            router.push('/dashboard/menu');
        } catch (e) {
            console.error(e);
            const error = e as Error;
            toast({ 
                variant: 'destructive', 
                title: 'Échec de l\'enregistrement',
                description: error.message || 'Une erreur est survenue lors de l\'enregistrement.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (myRestaurants.length === 0) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-[#121214] border border-white/5 p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/20" />
                    <ChefHat className="h-20 w-20 mx-auto text-gray-800 mb-8" />
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">Établissement Requis</h2>
                    <p className="text-gray-500 font-medium mb-10 text-sm">
                        Vous devez posséder au moins un établissement pour ajouter des plats au menu.
                    </p>
                    <Button 
                        asChild
                        className="h-16 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter transition-all"
                    >
                        <Link href="/dashboard/new-restaurant">Créer mon Établissement</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
                title: <span className="flex items-center gap-4">Nouveau <span className="text-orange-500">Plat</span></span>,
                subtitle: "Créez un nouvel article pour votre menu",
                backButtonHref: "/dashboard/menu",
                backButtonLabel: "Menu",
                badgeIcon: <Utensils className="h-4 w-4" />,
                badgeText: "Gestion de la Carte"
            }}
        >
            <div className="max-w-3xl mx-auto">
                <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                    
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Établissement</Label>
                            <Select
                                onValueChange={value => setSelectedRestaurant(myRestaurants.find(r => r.id === value) || null)}
                                value={selectedRestaurant?.id || ''}
                            >
                                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-none text-sm font-bold uppercase tracking-tight focus:ring-orange-500/50">
                                    <SelectValue placeholder="SÉLECTIONNER L'ÉTABLISSEMENT" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                    {myRestaurants.map(r => (
                                        <SelectItem key={r.id} value={r.id} className="focus:bg-orange-500 focus:text-white uppercase font-bold text-xs tracking-widest py-3">
                                            {r.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                            <div className="mt-10">
                                <Button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="h-16 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter text-lg shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                                >
                                    {loading ? <Loader className="animate-spin mr-3 h-6 w-6" /> : <Plus className="mr-3 h-6 w-6" />}
                                    Ajouter au Menu
                                </Button>
                            </div>
                        </MenuItemForm>
                    </div>
                </div>
            </div>
        </DashboardPage>
    );
}