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
import { logAdminAction } from '@/lib/audit-logs';

import { Button } from '@/components/ui/button';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { EditMenuItemDialog } from '@/components/edit-menu-item-dialog';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { Tag, BookOpen } from 'lucide-react';

export default function DashboardMenuPage() {
    const { user, activeRole } = useAuth();
    const { db } = useFirebase();
    const router = useRouter();
    const { restaurants, menuItems } = useData();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = React.useState<MenuItem | null>(null);
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
        const itemToDeleteObj = myMenuItems.find(item => item.id === itemId);
        setIsDeleting(itemId);
        try {
            await deleteDoc(doc(db, 'plats', itemId));
            
            // Log the action
            if (user) {
                await logAdminAction(db, {
                    adminId: user.uid,
                    adminEmail: user.email || 'inconnu',
                    action: 'DELETE_MENU_ITEM',
                    targetId: itemId,
                    details: `Suppression du plat: ${itemToDeleteObj?.nom || itemId}`,
                    metadata: {
                        restaurantId: itemToDeleteObj?.restaurantId,
                        itemCategory: itemToDeleteObj?.categorie
                    }
                });
            }

            toast({
                title: 'Plat supprimé',
                description: 'Le plat a été retiré de votre menu.',
            });
            setItemToDelete(null); // Clear item to delete after success
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

    const statsItems = React.useMemo(() => [
        {
            label: 'Total Articles',
            value: myMenuItems.length,
            icon: BookOpen,
            color: 'orange' as const
        },
        {
            label: 'Catégories',
            value: categories.length - 1, // Exclude 'Tous'
            icon: Tag
        }
    ], [myMenuItems.length, categories.length]);

    if (!user || activeRole !== 'restaurateur') return null;

    return (
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1550966842-2862ba996344?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <ChefHat className="h-4 w-4" />,
                badgeText: "Excellence Culinaire",
                title: <>Votre <span className="text-orange-500 italic text-shadow-orange">Carte</span></>,
                subtitle: "Gérez les articles de votre menu",
                children: <DashboardStats items={statsItems} />
            }}
        >
            <div className="space-y-6 md:space-y-8">
                {/* Category Selector */}
                <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 py-4 mb-4 flex overflow-x-auto gap-3 no-scrollbar scroll-smooth snap-x bg-background/80 backdrop-blur-xl md:relative md:top-auto md:mx-0 md:px-0 md:py-0 md:justify-center md:flex-wrap md:bg-transparent">
                    {categories.map((category, idx) => (
                        <motion.button
                            key={category}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "flex-none snap-start px-4 md:px-5 py-2 md:py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border",
                                selectedCategory === category 
                                    ? "bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20" 
                                    : "bg-white/5 backdrop-blur-md border-white/5 text-slate-400 hover:border-orange-500/30 hover:text-orange-500"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative glass-dark border border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/50 hover:shadow-orange-500/10 flex flex-col h-full rounded-[1.5rem] md:rounded-[2rem] shadow-2xl"
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
                                                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center border-b border-border/50">
                                                    <ChefHat className="h-12 w-12 text-muted/30" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                                            
                                            <div className="absolute bottom-4 left-4">
                                                <div className="bg-orange-500 px-4 py-1.5 text-[11px] font-black italic uppercase text-white shadow-xl rounded-lg">
                                                    {item.prix.toLocaleString('fr-FR')} <span className="text-[8px] opacity-80 ml-1">FCFA</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 flex-grow flex flex-col">
                                            <h3 className="text-base md:text-lg font-black italic tracking-tight text-foreground group-hover:text-orange-500 transition-colors mb-2 uppercase">
                                                {item.nom}
                                            </h3>
                                            <p className="text-muted-foreground text-[12px] font-medium line-clamp-2 mb-4 leading-relaxed italic">
                                                {item.description}
                                            </p>

                                            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 h-10 bg-card border-border hover:bg-orange-500 hover:border-orange-500 hover:text-white text-foreground rounded-xl font-black uppercase tracking-widest text-[9px] transition-all duration-500 shadow-sm"
                                                    onClick={() => setEditingItem(item)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                                    Modifier
                                                </Button>

                                                <Button 
                                                    variant="outline" 
                                                    className="h-10 w-10 bg-card border-border hover:bg-red-500/10 hover:border-red-500/20 text-muted-foreground hover:text-red-500 rounded-xl transition-all duration-500 shadow-sm"
                                                    disabled={isDeleting === item.id}
                                                    onClick={() => setItemToDelete(item)}
                                                >
                                                    {isDeleting === item.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Premium Accent */}
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto glass-dark border border-white/5 p-12 md:p-20 text-center shadow-2xl relative overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] mt-12">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                                <div className="bg-orange-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20">
                                    <BookOpenCheck className="h-8 w-8 text-orange-500" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black italic tracking-tight text-foreground mb-4 uppercase">Carte Blanche</h2>
                                <p className="text-muted-foreground font-bold mb-10 text-xs uppercase tracking-[0.2em] italic">
                                    Aucun article n&apos;est répertorié dans cette catégorie pour le moment.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Add Button */}
                <div className="mt-8 flex justify-center">
                    <Button asChild className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic tracking-tight text-lg shadow-xl shadow-orange-500/20 transition-all duration-500 hover:scale-105 group uppercase">
                        <Link href="/dashboard/new-menu-item" className="flex items-center gap-3">
                            <Plus className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-500" />
                            Ajouter un Plat
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

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="bg-card/95 border border-border rounded-2xl shadow-2xl backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic tracking-tight text-xl text-foreground uppercase">Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                            Voulez-vous vraiment retirer &quot;{itemToDelete?.nom}&quot; de votre carte ? Cette action est définitive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-muted/80 rounded-xl font-black uppercase tracking-widest text-[9px]">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => itemToDelete && handleDeleteItem(itemToDelete.id)} 
                            disabled={!!isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-black italic tracking-tight px-8 uppercase"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </DashboardPage>
    );
}