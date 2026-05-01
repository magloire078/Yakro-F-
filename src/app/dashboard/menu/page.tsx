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
import { motion } from 'framer-motion';
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
        <div className="min-h-screen bg-[#0A0A0B] pb-32 overflow-x-hidden">
            {/* Cinematic Hero Section */}
            <div className="relative h-[30vh] md:h-[50vh] overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1550966842-2862ba996344?q=80&w=2070&auto=format&fit=crop"
                    alt="Menu Background"
                    fill
                    className="object-cover opacity-40 scale-105 animate-slow-zoom"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-black/60" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-10">
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Dashboard" href="/dashboard" />
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-4"
                    >
                        <ChefHat className="h-3 w-3 text-orange-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Excellence Culinaire</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none"
                    >
                        Votre <span className="text-orange-500">Carte</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 font-medium text-[10px] md:text-xs uppercase tracking-[0.3em]"
                    >
                        Gestion des saveurs et des expériences
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                {/* Category Selector / Tabs - Sticky on Mobile */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-4 mb-2 md:relative md:top-auto md:mx-0 md:px-0 md:py-0 md:mb-6 flex overflow-x-auto gap-3 no-scrollbar scroll-smooth snap-x bg-[#0A0A0B]/80 backdrop-blur-xl md:bg-transparent">
                    {categories.map((category, idx) => (
                        <motion.button
                            key={category}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedCategory(category)}
                            className={`flex-none snap-start px-6 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${
                                selectedCategory === category 
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                                    : 'bg-[#121214]/80 backdrop-blur-md border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                        >
                            {category}
                        </motion.button>
                    ))}
                </div>

                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
                        {filteredItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-[#121214] border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 flex flex-col h-full"
                            >
                                <div className="aspect-[16/10] relative overflow-hidden">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.nom}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-[#0A0A0B] flex items-center justify-center">
                                            <ChefHat className="h-12 w-12 text-white/5" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-60" />
                                    
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div className="bg-orange-500 px-3 py-1 text-[10px] font-black italic uppercase text-white skew-x-[-12deg]">
                                            {item.prix} FCFA
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors mb-2">
                                        {item.nom}
                                    </h3>
                                    <p className="text-gray-400 text-[11px] font-medium line-clamp-2 mb-6 italic leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="mt-auto flex items-center gap-2 pt-6 border-t border-white/5">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 h-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-none font-black italic uppercase tracking-tighter text-[9px]"
                                            onClick={() => setEditingItem(item)}
                                        >
                                            <Edit className="h-3 w-3 mr-2 text-orange-500" />
                                            Éditer
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="h-10 w-10 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-500 rounded-none transition-all duration-300"
                                                    disabled={isDeleting === item.id}
                                                >
                                                    {isDeleting === item.id ? <Loader className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-2xl text-white">Suppression Critique</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-400 font-medium">
                                                        Cette action est irréversible. Le plat &quot;{item.nom}&quot; sera définitivement retiré.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-6 gap-3">
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-none font-bold uppercase tracking-widest text-[10px]">
                                                        Annuler
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => handleDeleteItem(item.id)} 
                                                        disabled={!!isDeleting}
                                                        className="bg-red-500 hover:bg-red-600 text-white rounded-none font-black italic uppercase tracking-tighter"
                                                    >
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-orange-500 group-hover:w-full transition-all duration-700" />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-16 text-center shadow-2xl relative overflow-hidden rounded-2xl mt-12">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <BookOpenCheck className="h-20 w-20 text-orange-500/20 mx-auto mb-8" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Carte Blanche</h2>
                        <p className="text-gray-400 font-medium mb-10 text-lg">
                            Aucun article trouvé dans cette catégorie.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button asChild className="w-full md:w-auto h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500 hover:scale-105">
                        <Link href="/dashboard/new-menu-item" className="flex items-center gap-3">
                            <Plus className="h-6 w-6" />
                            Ajouter un Chef-d&apos;œuvre
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Persistent FAB for Mobile */}
            <div className="fixed bottom-8 right-6 z-50 md:hidden">
                <Button asChild className="h-16 w-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_0_30px_rgba(249,115,22,0.5)] p-0">
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
        </div>
    );
}