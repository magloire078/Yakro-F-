'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/lib/types';
import { doc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChefHat,
    Edit,
    Trash2,
    Loader,
    BookOpenCheck,
    Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { MobileBackButton } from '@/components/mobile-back-button';
import { EditMenuItemDialog } from '@/components/edit-menu-item-dialog';
import { cn } from '@/lib/utils';

export default function DashboardMenuPage() {
    const { user, activeRole } = useAuth();
    const { db } = useFirebase();
    const router = useRouter();
    const { restaurants, menuItems } = useData();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('Tous');

    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Veuillez sélectionner le profil "Restaurateur" pour accéder à cette page.',
            });
            router.push('/');
        }
    }, [user, router, activeRole, toast]);

    const myRestaurantIds = React.useMemo(() => {
        if (!user || activeRole !== 'restaurateur') return [];
        return restaurants.filter(r => r.proprietaireId === user.uid).map(r => r.id);
    }, [restaurants, user, activeRole]);

    const myMenuItems = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return menuItems.filter(item => myRestaurantIds.includes(item.restaurantId));
    }, [menuItems, myRestaurantIds]);

    const categories = React.useMemo(() => {
        const cats = Array.from(new Set(myMenuItems.map(item => item.categorie || 'Autres')));
        const order = ['Entrées', 'Plats', 'Desserts', 'Boissons', 'Autres'];
        
        const sortedCats = cats.sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return ['Tous', ...sortedCats];
    }, [myMenuItems]);

    const filteredItems = React.useMemo(() => {
        if (selectedCategory === 'Tous') return myMenuItems;
        return myMenuItems.filter(item => (item.categorie || 'Autres') === selectedCategory);
    }, [myMenuItems, selectedCategory]);

    const handleDeleteItem = async (itemId: string) => {
        setIsDeleting(itemId);
        try {
            await deleteDoc(doc(db, 'plats', itemId));
            toast({
                title: 'Plat supprimé',
                description: 'Le plat a été retiré de votre menu.',
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de supprimer le plat.',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    if (!user || activeRole !== 'restaurateur') return null;

    return (
        <div className="min-h-screen bg-white pb-32 overflow-x-hidden relative">
            {/* Elite Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.05),transparent_70%)]" />
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-orange-500/[0.02] rounded-full blur-[140px] pointer-events-none" />

            {/* Cinematic Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1550966842-2862ba996344?q=80&w=2070&auto=format&fit=crop"
                        alt="Menu Background"
                        fill
                        className="object-cover opacity-30 grayscale-[20%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent z-10" />
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-10 relative z-20">
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Retour" href="/restaurateur" />
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl mb-4 shadow-xl"
                    >
                        <ChefHat className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Excellence Culinaire</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-black italic tracking-tighter text-slate-900 mb-2 leading-none uppercase"
                    >
                        Votre <span className="text-orange-500">Carte</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.4em] uppercase italic"
                    >
                        Gestion des saveurs et des expériences
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
                {/* Category Selector */}
                <div className="sticky top-0 z-40 -mx-4 px-4 py-4 mb-8 md:relative md:top-auto md:mx-0 md:px-0 md:py-0 md:mb-10 flex overflow-x-auto gap-3 no-scrollbar scroll-smooth snap-x bg-white/80 backdrop-blur-xl md:bg-transparent">
                    {categories.map((category, idx) => (
                        <motion.button
                            key={category}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "flex-none snap-start px-6 md:px-8 py-3.5 md:py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border",
                                selectedCategory === category 
                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10" 
                                    : "bg-slate-50/60 backdrop-blur-md border-slate-200/50 text-slate-500 hover:border-orange-500/30 hover:text-orange-500"
                            )}
                        >
                            {category}
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white/70 backdrop-blur-xl border border-slate-200/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col h-full rounded-2xl"
                                    >
                                        <div className="aspect-[16/10] relative overflow-hidden">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.nom}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                                                    <ChefHat className="h-12 w-12 text-slate-200" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
                                            
                                            <div className="absolute bottom-4 left-4">
                                                <div className="bg-orange-500 px-4 py-1.5 text-[11px] font-black italic uppercase text-white shadow-xl rounded-lg">
                                                    {item.prix.toLocaleString('fr-FR')} FCFA
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-grow flex flex-col">
                                            <h3 className="text-xl md:text-2xl font-black italic tracking-tight text-slate-900 group-hover:text-orange-500 transition-colors mb-2 uppercase">
                                                {item.nom}
                                            </h3>
                                            <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 leading-relaxed italic">
                                                {item.description}
                                            </p>

                                            <div className="mt-auto flex items-center gap-3 pt-6 border-t border-slate-100">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 h-12 bg-white border-slate-200 hover:bg-orange-500 hover:border-orange-500 hover:text-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all duration-500 shadow-sm"
                                                    onClick={() => setEditingItem(item)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                                    Modifier
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button 
                                                            variant="outline" 
                                                            className="h-12 w-12 bg-white border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-500 shadow-sm"
                                                            disabled={isDeleting === item.id}
                                                        >
                                                            {isDeleting === item.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-white/90 border border-slate-200 rounded-2xl shadow-2xl backdrop-blur-xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-black italic tracking-tight text-2xl text-slate-900 uppercase">Confirmation</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                                                Voulez-vous vraiment retirer &quot;{item.nom}&quot; de votre carte ? Cette action est définitive.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-8 gap-3">
                                                            <AlertDialogCancel className="bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-black uppercase tracking-widest text-[9px]">
                                                                Annuler
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => handleDeleteItem(item.id)} 
                                                                disabled={!!isDeleting}
                                                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-black italic tracking-tight px-8 uppercase"
                                                            >
                                                                Supprimer
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                        {/* Premium Accent */}
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-xl border border-slate-200/60 p-16 text-center shadow-2xl relative overflow-hidden rounded-3xl mt-12">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                                <div className="bg-orange-500/10 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20">
                                    <BookOpenCheck className="h-10 w-10 text-orange-500" />
                                </div>
                                <h2 className="text-4xl font-black italic tracking-tight text-slate-900 mb-4 uppercase">Carte Blanche</h2>
                                <p className="text-slate-500 font-bold mb-10 text-xs uppercase tracking-[0.2em] italic">
                                    Aucun article n&apos;est répertorié dans cette catégorie pour le moment.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Add Button */}
                <div className="mt-16 flex justify-center">
                    <Button asChild className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic tracking-tight text-lg shadow-xl shadow-orange-500/20 transition-all duration-500 hover:scale-105 group uppercase">
                        <Link href="/dashboard/new-menu-item" className="flex items-center gap-3">
                            <Plus className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-500" />
                            Ajouter un Chef-d&apos;œuvre
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-8 right-6 z-50 md:hidden">
                <Button asChild className="h-16 w-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-500/20 p-0 hover:scale-110 transition-all">
                    <Link href="/dashboard/new-menu-item" className="flex items-center justify-center">
                        <Plus className="h-8 w-8" />
                    </Link>
                </Button>
            </div>

            {editingItem && (
                <EditMenuItemDialog
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    menuItem={editingItem}
                />
            )}

            {/* Bottom Branding */}
            <div className="text-center py-24 opacity-20 group hover:opacity-40 transition-opacity">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">
                    Yakro Gastronomie &bull; Excellence Culinaire
                </p>
            </div>
        </div>
    );
}