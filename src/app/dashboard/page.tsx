
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useImages } from '@/contexts/image-context';
import { Loader, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItemCard } from '@/components/menu-item-card';
import type { MenuItem, Restaurant } from '@/lib/types';
import { generateMenuItem } from '@/ai/flows/generate-menu-item-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
    const { restaurants, menuItems, setMenuItems } = useImages();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(restaurants[0] || null);
    const [description, setDescription] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [generatedItem, setGeneratedItem] = React.useState<MenuItem | null>(null);
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

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
            // Step 1: Generate the menu item details (name, desc, price, image prompt)
            const itemDetails = await generateMenuItem({
                restaurantName: selectedRestaurant.name,
                cuisine: selectedRestaurant.cuisine,
                description: description,
            });

            toast({
                title: 'Détails générés !',
                description: 'Création de l\'image en cours...',
            });

            // Step 2: Generate the image using the prompt from the first flow
            const { imageUrl } = await generateImage({ prompt: itemDetails.imagePrompt });

            const newItem: MenuItem = {
                 id: `gen-${Date.now()}`,
                 name: itemDetails.name,
                 description: itemDetails.generatedDescription,
                 price: itemDetails.price,
                 image: imageUrl,
                 imageHint: itemDetails.imagePrompt.split(' ').slice(0, 2).join(' '), // use first two words of prompt as hint
                 restaurantId: selectedRestaurant.id
            }
            setGeneratedItem(newItem);
            toast({
                title: 'Plat généré avec succès !',
                description: 'Voici une proposition. Vous pourrez bientôt l\'ajouter à votre menu.',
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
    
    const handleAddItemToMenu = () => {
        if (!generatedItem) return;
        setMenuItems([...menuItems, generatedItem]);
        setGeneratedItem(null);
        setDescription('');
        toast({
            title: 'Plat ajouté !',
            description: `${generatedItem.name} est maintenant disponible dans votre menu.`
        });
    }

    if (authLoading || !user) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-4xl font-headline text-primary mb-8">Dashboard Restaurateur</h1>
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
                                defaultValue={selectedRestaurant?.id}
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
                            <Label htmlFor="description">Description du plat</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Un plat de riz traditionnel avec du poulet mariné aux épices locales, servi avec une sauce arachide et des légumes frais."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <Button onClick={handleGenerateItem} disabled={loading || !description} size="lg" className="w-full">
                            {loading ? <Loader className="animate-spin" /> : <Wand2 className="mr-2" />}
                            Générer le plat
                        </Button>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-headline mb-4">Résultat de la génération</h2>
                     <div className="p-4 border-2 border-dashed rounded-lg min-h-[200px] flex items-center justify-center">
                        {loading ? (
                             <div className="text-center text-muted-foreground animate-pulse">
                                <p>L'IA est en cuisine...</p>
                             </div>
                        ) : generatedItem ? (
                           <div className="w-full max-w-md">
                                <MenuItemCard item={generatedItem} />
                           </div>
                        ) : (
                            <p className="text-muted-foreground">Le plat que vous générez apparaîtra ici.</p>
                        )}
                    </div>
                    {generatedItem && !loading && (
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setGeneratedItem(null)}>Rejeter</Button>
                             <Button onClick={handleAddItemToMenu}>Ajouter au menu</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
