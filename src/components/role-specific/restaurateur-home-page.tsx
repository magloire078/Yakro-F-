
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, Image as ImageIcon, ChefHat, Trash, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MenuItem, type Restaurant, type MenuOption } from '@/lib/types';
import { generateMenuItem, type GenerateMenuItemOutput } from '@/ai/flows/generate-menu-item-flow';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '../ui/badge';

type GeneratedMenuItem = Omit<MenuItem, 'id' | 'restaurantId' | 'image'>;

export default function RestaurateurHomePage() {
    const { restaurants, addMenuItem, isLoading: isDataLoading } = useData();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [generatedItem, setGeneratedItem] = React.useState<GeneratedMenuItem | null>(null);
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Form state for AI generation
    const [description, setDescription] = React.useState('');
    const [name, setName] = React.useState('');
    const [price, setPrice] = React.useState('');

    // Form state for menu item options
    const [sides, setSides] = React.useState<MenuOption[]>([]);
    const [drinks, setDrinks] = React.useState<MenuOption[]>([]);
    const [sideInput, setSideInput] = React.useState({ name: '', price: '' });
    const [drinkInput, setDrinkInput] = React.useState({ name: '', price: '' });


    React.useEffect(() => {
        if (restaurants.length > 0 && !selectedRestaurant) {
            setSelectedRestaurant(restaurants[0]);
        }
        if (restaurants.length === 0) {
            setSelectedRestaurant(null);
        }
    }, [restaurants, selectedRestaurant]);

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
        setGeneratedItem(null);
        toast({
            title: 'Génération de plat en cours...',
            description: 'L\'IA concocte quelque chose de délicieux pour vous. Cela peut prendre un moment.',
        });

        try {
            const itemDetails: GenerateMenuItemOutput = await generateMenuItem({
                restaurantName: selectedRestaurant.name,
                cuisine: selectedRestaurant.cuisine,
                description: description,
                ...(name && { name }),
                ...(price && { price: Number(price) }),
            });

            const newItem: GeneratedMenuItem = {
                name: itemDetails.name,
                description: itemDetails.description,
                price: itemDetails.price,
                imageHint: itemDetails.imageHint,
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
                description: 'Impossible de générer le plat pour le moment. Le quota de l\'IA est peut-être atteint.',
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
            await addMenuItem({ 
              ...generatedItem, 
              restaurantId: selectedRestaurant.id,
              availableSides: sides,
              availableDrinks: drinks,
            });
            setGeneratedItem(null);
            setDescription('');
            setName('');
            setPrice('');
            setSides([]);
            setDrinks([]);
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

    const handleAddOption = (type: 'side' | 'drink') => {
        if (type === 'side' && sideInput.name.trim() && sideInput.price.trim()) {
            setSides(prev => [...prev, { name: sideInput.name.trim(), price: Number(sideInput.price) }]);
            setSideInput({ name: '', price: '' });
        }
        if (type === 'drink' && drinkInput.name.trim() && drinkInput.price.trim()) {
            setDrinks(prev => [...prev, { name: drinkInput.name.trim(), price: Number(drinkInput.price) }]);
            setDrinkInput({ name: '', price: '' });
        }
    }

    const handleRemoveOption = (type: 'side' | 'drink', index: number) => {
        if (type === 'side') {
            setSides(prev => prev.filter((_, i) => i !== index));
        }
        if (type === 'drink') {
            setDrinks(prev => prev.filter((_, i) => i !== index));
        }
    }

    if (restaurants.length === 0) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Card className="max-w-lg text-center p-8">
                    <CardHeader>
                        <ChefHat className="h-16 w-16 mx-auto text-primary" />
                        <CardTitle className="text-2xl mt-4">Bienvenue sur votre espace restaurateur !</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                            Il semble que vous n'ayez pas encore de restaurant. Pour commencer à créer des plats avec notre IA, vous devez d'abord enregistrer votre établissement.
                        </CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer mon premier restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Dashboard Restaurateur</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Créateur de Plats par IA</CardTitle>
                        <CardDescription>Décrivez un plat, et laissez l'IA créer un nom, une description, et un prix. Vous pouvez aussi pré-remplir certains champs pour guider l'IA, et ajouter des options.</CardDescription>
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
                            <Label htmlFor="description">Description simple du plat (obligatoire)</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Un plat de riz traditionnel avec du poulet mariné..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                required
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

                         <div className="space-y-2">
                            <Label>Accompagnements (optionnel)</Label>
                             <div className="flex gap-2">
                                <Input value={sideInput.name} onChange={e => setSideInput({...sideInput, name: e.target.value})} placeholder="Ex: Alloco"/>
                                <Input value={sideInput.price} onChange={e => setSideInput({...sideInput, price: e.target.value})} placeholder="Prix" type="number" className="w-24"/>
                                <Button type="button" onClick={() => handleAddOption('side')} size="icon"><Plus /></Button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {sides.map((side, i) => <Badge key={i} variant="secondary">{side.name} (+{side.price} F) <Trash className="ml-2 h-3 w-3 cursor-pointer" onClick={() => handleRemoveOption('side', i)} /></Badge>)}
                             </div>
                        </div>

                         <div className="space-y-2">
                            <Label>Boissons (optionnel)</Label>
                             <div className="flex gap-2">
                                <Input value={drinkInput.name} onChange={e => setDrinkInput({...drinkInput, name: e.target.value})} placeholder="Ex: Bissap"/>
                                <Input value={drinkInput.price} onChange={e => setDrinkInput({...drinkInput, price: e.target.value})} placeholder="Prix" type="number" className="w-24"/>
                                <Button type="button" onClick={() => handleAddOption('drink')} size="icon"><Plus /></Button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {drinks.map((drink, i) => <Badge key={i} variant="secondary">{drink.name} (+{drink.price} F) <Trash className="ml-2 h-3 w-3 cursor-pointer" onClick={() => handleRemoveOption('drink', i)}/></Badge>)}
                             </div>
                        </div>

                        <Button onClick={handleGenerateItem} disabled={loading || !description} size="lg" className="w-full">
                            {loading ? <Loader className="animate-spin" /> : <Wand2 className="mr-2" />}
                            {loading ? 'Génération en cours...' : 'Générer le plat'}
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
                                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                     <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                     <p className="absolute bottom-2 text-xs text-muted-foreground">Image générée à l'ajout</p>
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
