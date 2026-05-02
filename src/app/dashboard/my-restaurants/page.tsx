'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData, deleteRestaurant } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
    UtensilsCrossed, 
    Edit, 
    Plus, 
    Trash2, 
    AlertTriangle, 
    MapPin,
    Star,
    ChefHat
} from 'lucide-react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MobileBackButton } from '@/components/mobile-back-button';

export default function MyRestaurantsPage() {
    const { user, activeRole } = useAuth();
    const { restaurants, menuItems } = useData();
    const { db } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            toast({
                variant: 'destructive',
                title: 'Accès non autorisé',
                description: 'Veuillez sélectionner le profil "Restaurateur" pour accéder à cette page.',
            });
            router.push('/');
        }
    }, [user, activeRole, router, toast]);

    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);

    const handleDelete = async (restaurantId: string) => {
        if (!db) return;
        
        try {
            setIsDeleting(restaurantId);
            await deleteRestaurant(db, restaurantId);
            toast({
                title: "Restaurant supprimé",
                description: "L'établissement a été supprimé avec succès.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le restaurant.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    if (!user || activeRole !== 'restaurateur') return null;

    return (
        <div className="min-h-screen bg-transparent pb-32 overflow-x-hidden relative">
            {/* Cinematic Header Section */}
            <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                        alt="Restaurateur Hero"
                        fill
                        className="object-cover scale-110 animate-slow-zoom opacity-10"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/60 z-10" />
                </div>
                
                <div className="relative z-30 text-center space-y-8 px-6 max-w-4xl">
                    <div className="md:hidden absolute top-6 left-4 z-50">
                        <MobileBackButton label="Dashboard" href="/restaurateur" />
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-2xl mb-2 shadow-2xl"
                    >
                        <ChefHat className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Elite Management</span>
                    </motion.div>
                    
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-9xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none"
                        >
                            Mes <span className="text-orange-500 italic">Établissements</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.4em]"
                        >
                            Pilotez votre empire culinaire avec précision
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center gap-10 md:gap-20 mt-12"
                    >
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 group-hover:text-orange-500 transition-colors">Actifs</p>
                            <p className="text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">{myRestaurants.length}</p>
                        </div>
                        <div className="w-px h-16 md:h-20 bg-white/10 self-center rotate-12" />
                        <div className="text-center group cursor-default">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 group-hover:text-emerald-500 transition-colors">Opérations</p>
                            <p className="text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">LIVE</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-40">
                {myRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myRestaurants.map((restaurant, index) => {
                            const placeholder = getPlaceholderImage(restaurant.indiceImage);
                            const imageSrc = (restaurant.image && restaurant.image !== "" && !restaurant.image.includes('picsum.photos'))
                                ? restaurant.image
                                : placeholder.url;
                            
                            return (
                                <motion.div 
                                    key={restaurant.id} 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative h-full"
                                >
                                    <div className="glass-dark border border-white/5 transition-all duration-500 group-hover:border-orange-500/50 overflow-hidden h-full flex flex-col shadow-2xl group-hover:shadow-orange-500/10 rounded-[2.5rem]">
                                        {/* Image Area */}
                                        <div className="relative h-64 w-full overflow-hidden">
                                            {imageSrc.includes('res.cloudinary.com') ? (
                                                <CldImage
                                                    src={imageSrc}
                                                    alt={restaurant.nom}
                                                    fill
                                                    crop="fill"
                                                    gravity="auto"
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                            ) : (
                                                <Image
                                                    src={imageSrc}
                                                    alt={restaurant.nom}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent" />
                                            
                                            {/* Status Overlay */}
                                            <div className="absolute top-6 left-6">
                                                <div className="px-4 py-2 bg-[#0A0A0B]/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Opérationnel</span>
                                                </div>
                                            </div>

                                            {restaurant.enVedette && (
                                                <div className="absolute top-6 right-6">
                                                    <div className="h-10 w-10 bg-orange-500 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                                                        <Star className="h-5 w-5 text-white fill-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-8 flex-grow flex flex-col">
                                            <div className="mb-6">
                                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-tight group-hover:text-orange-500 transition-colors duration-300">
                                                    {restaurant.nom}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <MapPin className="h-3 w-3 text-orange-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{restaurant.adresse || 'Emplacement non défini'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-2 mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Cuisine</span>
                                                    <span className="text-xs font-black text-white uppercase italic tracking-wider">{restaurant.cuisine}</span>
                                                </div>
                                                <div className="h-10 w-[1px] bg-white/10" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Expertise</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-black text-white">{restaurant.note || '0.0'}</span>
                                                        <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center gap-4 pt-6 border-t border-white/5">
                                                <Button 
                                                    variant="outline" 
                                                    asChild 
                                                    className="flex-1 rounded-2xl border-white/10 bg-white/5 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-300 font-black uppercase tracking-tighter text-[11px] h-14"
                                                >
                                                    <Link href={`/dashboard/my-restaurants/edit?id=${restaurant.id}`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Gérer
                                                    </Link>
                                                </Button>

                                                {(() => {
                                                    const hasPlats = menuItems.some(p => p.restaurantId === restaurant.id);
                                                    
                                                    return (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    className="h-14 w-14 rounded-2xl border border-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
                                                                    disabled={isDeleting === restaurant.id}
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="glass-dark border border-white/10 text-white rounded-[2.5rem] max-w-md backdrop-blur-3xl shadow-2xl">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-3xl flex items-center gap-3 text-white">
                                                                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                                                                        {hasPlats ? 'ALERTE CRITIQUE' : 'DISSOLUTION'}
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-slate-400 font-medium pt-4 text-base leading-relaxed italic">
                                                                        {hasPlats ? (
                                                                            <>
                                                                                Cet établissement contient encore des créations culinaires actives. 
                                                                                <span className="block mt-4 text-orange-500 font-bold uppercase tracking-widest text-xs">Veuillez purger le menu avant de pouvoir dissoudre cet établissement.</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Cette action est irréversible. Vous êtes sur le point de dissoudre 
                                                                                <strong className="text-white uppercase tracking-tighter"> {restaurant.nom}</strong> et d&apos;effacer son héritage numérique du registre Yakro.
                                                                            </>
                                                                        )}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className="mt-10 gap-4">
                                                                    <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white uppercase font-bold tracking-widest text-[10px] h-12">ANNULER</AlertDialogCancel>
                                                                    {hasPlats ? (
                                                                        <AlertDialogAction asChild className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white uppercase font-black tracking-widest text-[10px] h-12">
                                                                            <Link href="/dashboard/menu">GÉRER LE MENU</Link>
                                                                        </AlertDialogAction>
                                                                    ) : (
                                                                        <AlertDialogAction 
                                                                            onClick={() => handleDelete(restaurant.id)}
                                                                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white uppercase font-black tracking-widest text-[10px] h-12"
                                                                        >
                                                                            CONFIRMER DISSOLUTION
                                                                        </AlertDialogAction>
                                                                    )}
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 group-hover:w-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                                    </div>
                                </motion.div>

                            );
                        })}
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto glass-dark border border-white/5 p-16 text-center shadow-2xl relative overflow-hidden rounded-[3rem] mt-12">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-orange-500/10 blur-[50px] rounded-full scale-150" />
                            <UtensilsCrossed className="h-20 w-20 text-orange-500/40 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Empire Vierge</h2>
                        <p className="text-slate-500 font-medium mb-10 text-lg italic">
                            Aucun établissement n&apos;est encore enregistré sous votre bannière.
                        </p>
                    </div>
                )}

                {/* Desktop Action Button */}
                <div className="hidden md:flex justify-center mt-12">
                    <Button asChild className="h-20 px-16 bg-orange-500 hover:bg-orange-600 text-white rounded-[2rem] font-black italic uppercase tracking-tighter text-xl shadow-[0_20px_40px_rgba(249,115,22,0.2)] transition-all duration-500 hover:scale-105 active:scale-95 group">
                        <Link href="/dashboard/new-restaurant" className="flex items-center gap-4">
                            <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-500" />
                            Établir un Restaurant
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Persistent FAB for Mobile */}
            <div className="fixed bottom-8 right-6 z-50 md:hidden">
                <Button asChild className="h-20 w-20 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_20px_40px_rgba(249,115,22,0.4)] p-0 border-4 border-[#0A0A0B]">
                    <Link href="/dashboard/new-restaurant" className="flex items-center justify-center">
                        <Plus className="h-10 w-10" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}