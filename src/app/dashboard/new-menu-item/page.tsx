
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import Image from 'next/image';
import { MenuItemForm, menuItemFormSchema, type MenuItemFormValues } from '@/components/menu-item-form';

export default function NewMenuItemPage() {
    const { restaurants, addMenuItem } = useData();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    // Form state for AI generation
    const [description, setDescription] = React.useState('');
    const [name, setName] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                form.setValue('image', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleGenerateItem = async () => {
        if (!selectedRestaurant || !description) {
            toast({
                variant: 'destructive',
                title: 'Informations manquantes',
                description: 'Veuillez sélectionner un restaurant et entrer au minimum une description.',
            });
            return;
        }
        setLoading(true);
        toast({
            title: 'Génération de plat en cours...',
            description: 'L\'IA concocte quelque chose de délicieux pour vous. Cela peut prendre un moment.',
        });

        try {
            const itemDetails: GenerateMenuItemOutput = await generateMenuItem({
                restaurantName: selectedRestaurant.nom,
                cuisine: selectedRestaurant.cuisine,
                description: description,
                ...(name && { nom: name }),
                ...(price && { prix: Number(price) }),
            });

            form.reset({
                nom: itemDetails.nom,
                description: itemDetails.description,
                prix: itemDetails.prix,
                indiceImage: itemDetails.indiceImage,
                accompagnementsDisponibles: [],
                boissonsDisponibles: [],
            });

            toast({
                title: 'Plat généré avec succès !',
                description: 'Voici une proposition. Vous pouvez la modifier et l\'ajouter à votre menu.',
            });
        } catch (error) {
            console.error('Failed to generate menu item:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de génération',
                description: 'Impossible de générer le plat pour le moment. Le quota de l\'IA est peut-être atteint.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemToMenu = async (data: MenuItemFormValues, imageFile: File | null) => {
        if (!selectedRestaurant) return;

        setLoading(true);
        try {
            const finalItemData: Omit<MenuItem, 'id'> = {
                nom: data.nom,
                description: data.description,
                prix: data.prix,
                indiceImage: data.indiceImage || `${data.nom} ${selectedRestaurant.cuisine}`,
                restaurantId: selectedRestaurant.id,
                accompagnementsDisponibles: data.accompagnementsDisponibles,
                boissonsDisponibles: data.boissonsDisponibles,
            };

            await addMenuItem(finalItemData, imageFile);
            
            // Reset state
            setDescription('');
            setName('');
            setPrice('');
            setImageFile(null);
            setImagePreview(null);
            form.reset();

            toast({
                title: 'Plat ajouté !',
                description: `${data.nom} est maintenant disponible dans votre menu.`,
            });
             router.push('/dashboard/menu');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Impossible d'ajouter le plat à la base de données.",
            });
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
                        <CardTitle className="text-2xl mt-4">Commencez par créer un restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                           Pour ajouter des plats, vous devez d'abord enregistrer un établissement.
                        </CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer mon premier restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    const isGenerated = !!form.getValues('nom');

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Créateur de Plats IA</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Fournir les informations</CardTitle>
                        <CardDescription>Décrivez un plat et laissez l'IA créer les détails. Fournissez un nom ou un prix pour guider l'IA, ou laissez-la faire tout le travail !</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Restaurant</Label>
                            <Select
                                onValueChange={value => setSelectedRestaurant(myRestaurants.find(r => r.id === value) || null)}
                                value={selectedRestaurant?.id || ''}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisissez votre restaurant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {myRestaurants.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description simple du plat (obligatoire pour l'IA)</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Un plat de riz traditionnel avec du poulet mariné..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du plat (optionnel)</Label>
                                <Input id="name" placeholder="Ex: Poulet Yassa" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Prix (optionnel)</Label>
                                <Input id="price" type="number" placeholder="Ex: 3500" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                        </div>

                        <Button onClick={handleGenerateItem} disabled={loading || !description} size="lg" className="w-full">
                            <Wand2 className="mr-2" />
                            Générer avec l'IA
                        </Button>
                    </CardContent>
                </Card>

                <div>
                     <Card className="sticky top-8">
                        <CardHeader>
                            <CardTitle>2. Valider et ajouter au menu</CardTitle>
                            <CardDescription>Le plat généré par l'IA apparaîtra ici. Vous pourrez le modifier avant de l'ajouter.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 border-2 border-dashed rounded-lg min-h-[400px] flex items-center justify-center bg-card">
                            {loading && !isGenerated ? (
                                <div className="text-center text-muted-foreground animate-pulse">
                                    <Wand2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                                    <p>L'IA est en cuisine...</p>
                                </div>
                            ) : isGenerated ? (
                                <MenuItemForm
                                    form={form}
                                    onSubmit={handleAddItemToMenu}
                                    isLoading={loading}
                                    imageFile={imageFile}
                                    onImageChange={handleImageChange}
                                >
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button variant="outline" type="button" onClick={() => form.reset()}>Rejeter</Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? <Loader className="animate-spin mr-2" /> : null}
                                            Ajouter au menu
                                        </Button>
                                    </div>
                                </MenuItemForm>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                                    <p>Le plat généré par l'IA apparaîtra ici.</p>
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
}
