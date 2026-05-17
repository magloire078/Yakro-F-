'use client';

import * as React from 'react';
import { 
    Star, 
    Clock, 
    MoreHorizontal, 
    ExternalLink,
    Store,
    TrendingUp,
    ShieldAlert,
    Filter,
    Trash2,
    Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { useData } from '@/contexts/data-context';
import { Restaurant } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { logAdminAction, type AdminAction } from '@/lib/audit-logs';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteRestaurantAction } from '@/app/actions/restaurant-actions';

export function RestaurantManager() {
    const { restaurants } = useData();
    const { db } = useFirebase();
    const { user } = useAuth();
    const { toast } = useToast();
    const [restaurantToDelete, setRestaurantToDelete] = React.useState<Restaurant | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleAction = async (restaurant: Restaurant, action: 'FEATURE_RESTAURANT' | 'UNFEATURE_RESTAURANT' | 'SUSPEND_RESTAURANT' | 'ACTIVATE_RESTAURANT' | 'DELETE_RESTAURANT') => {
        if (!user) return;

        try {
            const restaurantRef = doc(db, 'restaurants', restaurant.id);
            let updateData = {};
            let detailMessage = "";

            switch (action) {
                case 'FEATURE_RESTAURANT':
                    updateData = { enVedette: true };
                    detailMessage = `Mise en vedette du restaurant ${restaurant.nom}`;
                    break;
                case 'UNFEATURE_RESTAURANT':
                    updateData = { enVedette: false };
                    detailMessage = `Retrait des vedettes du restaurant ${restaurant.nom}`;
                    break;
                case 'SUSPEND_RESTAURANT':
                    updateData = { suspendu: true };
                    detailMessage = `Suspension du restaurant ${restaurant.nom}`;
                    break;
                case 'ACTIVATE_RESTAURANT':
                    updateData = { suspendu: false };
                    detailMessage = `Réactivation du restaurant ${restaurant.nom}`;
                    break;
                case 'DELETE_RESTAURANT':
                    detailMessage = `SUPPRESSION DÉFINITIVE du restaurant ${restaurant.nom}`;
                    break;
            }

            if (action === 'DELETE_RESTAURANT') {
                setIsDeleting(true);
                await deleteRestaurantAction(restaurant.id);
                setIsDeleting(false);
                setRestaurantToDelete(null);
            } else {
                await updateDoc(restaurantRef, updateData);
            }

            await logAdminAction(db, {
                adminId: user.uid,
                adminEmail: user.email || 'unknown',
                action: action as AdminAction,
                targetId: restaurant.id,
                details: detailMessage
            });

            toast({
                title: "ORDRE EXÉCUTÉ",
                description: `Action tracée dans les registres d'audit Yakro.`,
                className: "bg-card border-orange-500 text-foreground font-black uppercase italic tracking-tighter"
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "ÉCHEC CRITIQUE",
                description: "Interruption du protocole de gestion.",
                className: "bg-red-950 border-red-500 text-white font-black uppercase italic tracking-tighter"
            });
        }
    };

    return (
        <div className="bg-card/40 backdrop-blur-3xl border border-border/50 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <Store className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                            Gestion des <span className="text-orange-500 italic">Bastions</span>
                        </h2>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        SURVEILLANCE ET MODULATION DU RÉSEAU GASTRONOMIQUE YAKRO
                    </p>
                </div>
                    
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="px-6 py-3 bg-card/50 border border-border/50 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">CAPACITÉ RÉSEAU</span>
                        <span className="text-xl font-black italic text-foreground">{restaurants.length} UNITÉS</span>
                    </div>
                    <Button variant="outline" className="h-14 w-14 rounded-2xl bg-card/50 border-border/50 hover:bg-orange-500/10 hover:text-orange-500 text-foreground transition-all">
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            <div className="relative z-10">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                    <TableHeader className="border-border/50">
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6 px-4">Identifiant / Unité</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Catégorie</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Performance</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Statut Opérationnel</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-40 py-6 px-4">Commandes</TableHead>
                        </TableRow>
                    </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {restaurants.map((restaurant, idx) => (
                                    <motion.tr 
                                        key={restaurant.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group border-border/50 hover:bg-card/50 transition-all cursor-default"
                                    >
                                        <TableCell className="py-6 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative h-12 w-12 rounded-2xl border border-border group-hover:border-orange-500/30 transition-all group-hover:scale-110 shadow-lg overflow-hidden">
                                                    <Image 
                                                        src={restaurant.image || `/assets/marketing/hero-food.png`}
                                                        alt={restaurant.nom}
                                                        fill
                                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="font-black text-sm text-foreground uppercase italic tracking-tight group-hover:text-orange-500 transition-colors">{restaurant.nom}</span>
                                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest truncate">{restaurant.adresse || 'ZONE YAKRO CENTRALE'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <Badge variant="outline" className="rounded-xl border-orange-500/30 text-orange-500 bg-orange-500/5 text-[9px] font-black uppercase tracking-widest py-1.5 px-3">
                                                {restaurant.cuisine}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={cn("h-3 w-3", s <= Math.round(restaurant.note) ? "fill-orange-500 text-orange-500" : "fill-muted/20 text-muted/30")} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-foreground italic">{restaurant.note.toFixed(1)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {restaurant.tempsDeLivraison} MIN
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_10px]",
                                                    restaurant.suspendu ? "bg-red-500 shadow-red-500" : "bg-green-500 shadow-green-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest",
                                                    restaurant.suspendu ? "text-red-500" : "text-green-500"
                                                )}>
                                                    {restaurant.suspendu ? 'SUSPENDU' : 'ACTIF'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-6 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-orange-500/10 text-slate-500 hover:text-orange-500 border border-transparent hover:border-orange-500/20 transition-all hover:scale-110">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-3xl border-border/50 rounded-2xl p-1 shadow-2xl text-foreground overflow-hidden">
                                                    <DropdownMenuItem className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-orange-500 focus:text-white cursor-pointer transition-colors">
                                                        <ExternalLink className="h-4 w-4" />
                                                        Accéder à la Vitrine
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-green-600 focus:text-white cursor-pointer transition-colors"
                                                        onClick={() => handleAction(restaurant, restaurant.enVedette ? 'UNFEATURE_RESTAURANT' : 'FEATURE_RESTAURANT')}
                                                    >
                                                        <TrendingUp className="h-4 w-4" />
                                                        {restaurant.enVedette ? 'Retirer des Vedettes' : 'Propulser en Vedette'}
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-border/50 my-1" />
                                                    <DropdownMenuItem 
                                                        className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-red-600 focus:text-white cursor-pointer transition-colors text-red-500"
                                                        onClick={() => handleAction(restaurant, restaurant.suspendu ? 'ACTIVATE_RESTAURANT' : 'SUSPEND_RESTAURANT')}
                                                    >
                                                        <ShieldAlert className="h-4 w-4" />
                                                        {restaurant.suspendu ? 'Réactiver le Service' : 'Interruption de Service'}
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-border/50 my-1" />
                                                    <DropdownMenuItem 
                                                        className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-red-700 focus:text-white cursor-pointer transition-colors text-red-600"
                                                        onClick={() => setRestaurantToDelete(restaurant)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Suppression Définitive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <div className="p-8 bg-card/30 flex justify-between items-center border-t border-border/50 relative z-10 mt-6">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Protocol: BASTION-CONTROL-v2.1</span>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card/50 border-border/50 text-[9px] font-black uppercase tracking-widest px-6 hover:bg-card transition-all">PRÉCÉDENT</Button>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card/50 border-border/50 text-[9px] font-black uppercase tracking-widest px-6 hover:bg-card transition-all">SUIVANT</Button>
                </div>
            </div>

            {/* Non-blocking Restaurant Deletion Confirmation */}
            <AlertDialog open={!!restaurantToDelete} onOpenChange={(open) => !open && setRestaurantToDelete(null)}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-[2rem] shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Destruction du <span className="text-red-500 italic">Bastion</span></AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] py-4 leading-relaxed">
                            Êtes-vous certain de vouloir raser définitivement <span className="text-foreground"> {restaurantToDelete?.nom}</span> ? 
                            <br /><br />
                            Toutes les données associées seront purgées du réseau Yakro. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-6">
                        <AlertDialogCancel className="rounded-xl h-12 bg-card/50 border-border text-[9px] font-black uppercase tracking-widest px-8">ANNULER</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => restaurantToDelete && handleAction(restaurantToDelete, 'DELETE_RESTAURANT')}
                            disabled={isDeleting}
                            className="rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white font-black italic uppercase tracking-tighter px-8 shadow-xl shadow-red-600/20"
                        >
                            {isDeleting ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            CONFIRMER LA DESTRUCTION
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
