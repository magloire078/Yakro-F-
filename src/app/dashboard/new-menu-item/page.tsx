'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, Image as ImageIcon, ChefHat, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MenuItem, type Restaurant } from '@/lib/types';
import { generateMenuItemAction, generateImageAction } from '@/app/actions/ai-actions';
import { uploadImage } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MenuItemForm, menuItemFormSchema, type MenuItemFormValues } from '@/components/menu-item-form';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBackButton } from '@/components/mobile-back-button';

export default function NewMenuItemPage() {
    const { restaurants } = useData();
    const { db } = useFirebase();
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(false);
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

    const handleGenerateItem = async () => {
        if (!selectedRestaurant || !description) {
            toast({ variant: 'destructive', title: 'Données Insuffisantes', description: 'Veuillez spécifier l&apos;établissement et la description.' });
            return;
        }
        setLoading(true);
        setGenerationError(false);
        try {
            const result = await generateMenuItemAction({
                restaurantName: selectedRestaurant.nom,
                cuisine: selectedRestaurant.cuisine,
                description: description,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            const itemDetails = result.data;

            form.reset({
                nom: itemDetails.nom,
                description: itemDetails.description,
                prix: itemDetails.prix,
                categorie: itemDetails.categorie,
                indiceImage: itemDetails.indiceImage,
                accompagnementsDisponibles: [],
                boissonsDisponibles: [],
                ingredients: [],
            });
            
            toast({ title: 'Concept Gastronomique Généré', description: 'Le moteur Yakro AI a finalisé votre recette.' });
        } catch (e) {
            console.error("L'IA a eu un petit hoquet:", e);
            setGenerationError(true);
            toast({ variant: 'destructive', title: 'Anomalie de Génération', description: 'Le moteur neuronal a rencontré une résistance.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        const nom = form.getValues('nom');
        if (!nom) return;

        setImageLoading(true);
        try {
            const result = await generateImageAction({ prompt: nom });
            if (!result.success) throw new Error(result.error);
            
            form.setValue('image', result.data.imageDataUri);
            toast({ title: 'Capture Visuelle Finalisée', description: 'L&apos;esthétique du plat a été immortalisée.' });
        } catch (e) {
            const error = e as Error;
            toast({ 
                variant: 'destructive', 
                title: 'Défaut de Visualisation', 
                description: error.message || 'Impossible de matérialiser l&apos;image.' 
            });
        } finally {
            setImageLoading(false);
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
            categorie: data.categorie,
            indiceImage: data.indiceImage || `${data.nom} ${selectedRestaurant.cuisine}`,
            restaurantId: selectedRestaurant.id,
            accompagnementsDisponibles: data.accompagnementsDisponibles,
            boissonsDisponibles: data.boissonsDisponibles,
            ingredients: data.ingredients,
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

            toast({ title: 'Héritage Culinaire Établi', description: 'Votre plat a été inscrit dans le registre Elite.' });
            router.push('/dashboard/menu');
        } catch (e) {
            console.error(e);
            const error = e as Error;
            toast({ 
                variant: 'destructive', 
                title: 'Échec d&apos;Inscription',
                description: error.message || 'Le registre a rejeté cette entrée.'
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
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">Infrastructure Requise</h2>
                    <p className="text-gray-500 font-medium mb-10 text-sm">
                        L&apos;IA culinaire nécessite un établissement hôte pour initialiser la génération de menus.
                    </p>
                    <Button 
                        asChild
                        className="h-16 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter transition-all"
                    >
                        <Link href="/dashboard/new-restaurant">Fonder mon Établissement</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const isGenerated = !!form.getValues('nom');

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white">
            {/* Cinematic Hero */}
            <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div 
                    className="absolute inset-0 bg-cover bg-center animate-slow-zoom bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent z-20" />
                
                {/* Mobile Navigation */}
                <div className="md:hidden absolute top-6 left-4 z-50">
                    <MobileBackButton label="Menu" href="/dashboard/menu" />
                </div>

                <div className="relative z-30 text-center px-4 pt-12 md:pt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-md border border-orange-500/30 mb-6"
                    >
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Moteur Neural Yakro AI</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">
                        Créateur <span className="text-orange-500">Elite</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-gray-500 italic">
                        Sublimez votre carte par l&apos;intelligence artificielle prédictive.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-40 pb-32">
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Step 1: Input Analysis */}
                    <div className="space-y-8">
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-10 relative overflow-hidden h-full flex flex-col">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/20" />
                            
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-12 w-12 bg-white/5 border border-white/5 flex items-center justify-center">
                                    <span className="text-xl font-black italic text-orange-500">01</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Analyse Conceptuelle</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Définissez l&apos;essence du plat</p>
                                </div>
                            </div>

                            <div className="space-y-8 flex-grow">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Établissement Hôte</Label>
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

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Vision Culinaire</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="EX: POULET BRAISÉ AUX ÉPICES RARES ET ATTIÉKÉ ROYAL..."
                                        className="min-h-[150px] bg-white/5 border-white/10 rounded-none text-sm font-medium focus:ring-orange-500/50 resize-none p-5 uppercase tracking-tight placeholder:opacity-20"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateItem}
                                disabled={loading || !description}
                                className="mt-10 h-16 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter text-lg transition-all group overflow-hidden relative"
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-3"
                                        >
                                            <Loader className="animate-spin h-6 w-6" />
                                            <span>Fusion Neuronale...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="ready"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-3"
                                        >
                                            <Wand2 className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                                            <span>Invoquer l&apos;Excellence</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Manifestation */}
                    <div className="space-y-8">
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-10 relative overflow-hidden h-full flex flex-col min-h-[500px]">
                            {generationError && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 flex items-center gap-2 z-50 font-black italic uppercase text-[10px] tracking-tighter shadow-2xl"
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                    <span>Signal Interrompu</span>
                                </motion.div>
                            )}

                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-12 w-12 bg-white/5 border border-white/5 flex items-center justify-center">
                                    <span className="text-xl font-black italic text-orange-500">02</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Manifestation Elite</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Validation et déploiement final</p>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col justify-center">
                                {isGenerated ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full"
                                    >
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
                                            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full">
                                                <Button 
                                                    variant="outline" 
                                                    type="button" 
                                                    onClick={handleGenerateImage} 
                                                    disabled={imageLoading || loading}
                                                    className="h-14 flex-1 bg-white/5 border-white/10 hover:bg-orange-500/10 hover:border-orange-500/50 text-white rounded-none font-black italic uppercase tracking-tighter transition-all"
                                                >
                                                    {imageLoading ? <Loader className="animate-spin mr-3 h-5 w-5 text-orange-500" /> : <ImageIcon className="mr-3 h-5 w-5 text-orange-500" />}
                                                    {imageLoading ? 'Visualisation...' : 'Générer Visuel IA'}
                                                </Button>
                                                
                                                <Button type="submit" disabled={loading} className="h-14 flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                                                    {loading ? <Loader className="animate-spin mr-3 h-5 w-5" /> : <Flame className="mr-3 h-5 w-5" />}
                                                    Inscrire au Menu
                                                </Button>
                                            </div>
                                            
                                            <div className="mt-4 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        form.reset();
                                                        setGenerationError(false);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors py-2"
                                                >
                                                    [ Réinitialiser la Matrice ]
                                                </button>
                                            </div>
                                        </MenuItemForm>
                                    </motion.div>
                                ) : (
                                    <div className="text-center space-y-8 py-10 opacity-40">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                            <div className="h-24 w-24 bg-white/5 border border-dashed border-white/20 flex items-center justify-center relative">
                                                <ImageIcon className="h-10 w-10 text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">En attente d&apos;analyse</p>
                                            <p className="text-[11px] font-medium text-gray-600 max-w-[250px] mx-auto italic leading-relaxed">
                                                &ldquo;La création culinaire d&apos;exception commence par une intention claire.&rdquo;
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Footnote */}
                <div className="mt-16 text-center opacity-20 group cursor-default">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 transition-all group-hover:tracking-[0.6em] duration-700">
                        Yakro Go Neural Engine v4.0 &bull; High Performance Computing
                    </p>
                </div>
            </div>
        </div>
    );
}