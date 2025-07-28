

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem, Restaurant, SUPER_USER_EMAIL } from '@/lib/types';
import { generateMenuItem } from '@/ai/flows/generate-menu-item-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

type GeneratedMenuItem = Omit<MenuItem, 'id' | 'restaurantId'>;

export default function DashboardPage() {
    const { restaurants, addMenuItem } = useData();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [description, setDescription] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [generatedItem, setGeneratedItem] = React.useState<GeneratedMenuItem | null>(null);
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading && (!user || user.email !== SUPER_USER_EMAIL)) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    React.useEffect(() => {
        if (!restaurants.length) return;
        if (!selectedRestaurant) {
            setSelectedRestaurant(restaurants[0]);
        }
    }, [restaurants, selectedRestaurant]);

    const handleGenerateItem = async () => {
        if (!selectedRestaurant || !description) {
            toast({
                variant: 'destructive',
                title: 'Informations manquantes',
                description: 'Veuillez sélectionner un restaurant et entrer une description.',
            });
            return;
        }
        setLoading(true);
        setGeneratedItem(null);
        toast({
            title: 'Génération de plat en cours...',
            description: 'L\'IA concocte quelque chose de délicieux pour vous.',
        });

        try {
            const itemDetails = await generateMenuItem({
                restaurantName: selectedRestaurant.name,
                cuisine: selectedRestaurant.cuisine,
                description: description,
            });

            toast({
                title: 'Détails générés !',
                description: 'Création de l\'image en cours...',
            });

            const { imageUrl } = await generateImage({ prompt: itemDetails.imagePrompt });

            const newItem: GeneratedMenuItem = {
                name: itemDetails.name,
                description: itemDetails.generatedDescription,
                price: itemDetails.price,
                image: imageUrl,
                imageHint: itemDetails.imagePrompt.split(' ').slice(0, 2).join(' '),
            };
            setGeneratedItem(newItem);
            toast({
                title: 'Plat généré avec succès !',
                description: 'Voici une proposition. Vous pouvez la modifier et l\'ajouter à votre menu.',
            });
        } catch (error) {
            console.error('Failed to generate menu item:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de génération',
                description: 'Impossible de générer le plat pour le moment.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemToMenu = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!generatedItem || !selectedRestaurant) return;

        setLoading(true);
        try {
            await addMenuItem({ ...generatedItem, restaurantId: selectedRestaurant.id });
            setGeneratedItem(null);
            setDescription('');
            toast({
                title: 'Plat ajouté !',
                description: `${generatedItem.name} est maintenant disponible dans votre menu.`,
            });
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

    const handleItemChange = (field: keyof GeneratedMenuItem, value: string | number) => {
        if (generatedItem) {
            setGeneratedItem({ ...generatedItem, [field]: value });
        }
    };

    if (authLoading || !user || user.email !== SUPER_USER_EMAIL) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Dashboard Restaurateur</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Créateur de Plats par IA</CardTitle>
                        <CardDescription>Décrivez simplement le plat que vous imaginez, et laissez l'IA créer un nom, une description, un prix et une image pour vous.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Restaurant</Label>
                            <Select
                                onValueChange={value => setSelectedRestaurant(restaurants.find(r => r.id === value) || null)}
                                value={selectedRestaurant?.id || ''}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisissez votre restaurant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {restaurants.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description simple du plat</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Un plat de riz traditionnel avec du poulet mariné aux épices locales, servi avec une sauce arachide et des légumes frais."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <Button onClick={handleGenerateItem} disabled={loading || !description} size="lg" className="w-full">
                            {loading && !generatedItem ? <Loader className="animate-spin" /> : <Wand2 className="mr-2" />}
                            {loading && !generatedItem ? 'Génération en cours...' : 'Générer le plat'}
                        </Button>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-headline mb-4">Résultat de la génération</h2>
                    <div className="p-4 border-2 border-dashed rounded-lg min-h-[400px] flex items-center justify-center bg-card">
                        {loading && !generatedItem ? (
                            <div className="text-center text-muted-foreground animate-pulse">
                                <Wand2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                                <p>L'IA est en cuisine...</p>
                            </div>
                        ) : generatedItem ? (
                            <form onSubmit={handleAddItemToMenu} className="w-full space-y-4">
                                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                     <NextImage src={generatedItem.image} alt={generatedItem.name} layout="fill" objectFit="cover" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="itemName">Nom du plat</Label>
                                    <Input id="itemName" value={generatedItem.name} onChange={(e) => handleItemChange('name', e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="itemDescription">Description</Label>
                                    <Textarea id="itemDescription" value={generatedItem.description} onChange={(e) => handleItemChange('description', e.target.value)} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="itemPrice">Prix (FCFA)</Label>
                                    <Input id="itemPrice" type="number" value={generatedItem.price} onChange={(e) => handleItemChange('price', Number(e.target.value))} />
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button variant="outline" type="button" onClick={() => setGeneratedItem(null)}>Rejeter</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? <Loader className="animate-spin mr-2" /> : null}
                                        Ajouter au menu
                                    </Button>
                                </div>
                            </form>
                        ) : (
                             <div className="text-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                                <p>Le plat que vous générez apparaîtra ici.</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
