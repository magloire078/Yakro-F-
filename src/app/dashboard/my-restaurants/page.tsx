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
        <div className="min-h-screen bg-[#0A0A0B] pb-32 overflow-x-hidden text-white relative">
            {/* Elite Background Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]" />
            </div>

            {/* Cinematic Hero Section */}
            <div className="relative h-[40vh] md:h-[55vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                        alt="Restaurateur Hero"
                        fill
                        className="object-cover scale-105 animate-slow-zoom opacity-20"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/0 via-[#0A0A0B]/60 to-[#0A0A0B] z-10" />
                </div>

                {/* Mobile Back Button — pattern Elite */}
                <MobileBackButton
                    label="Dashboard"
                    href="/dashboard"
                    className="md:hidden absolute top-6 left-4 z-50 mb-0"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-30 pt-10 md:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-sm"
                    >
                        <ChefHat className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Elite Management</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.85] mb-3"
                    >
                        Mes <span className="text-orange-500">Établissements</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs italic"
                    >
                        Pilotez votre empire culinaire avec précision
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                {myRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                                    <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 transition-all duration-500 group-hover:border-orange-500/30 overflow-hidden h-full flex flex-col shadow-2xl group-hover:shadow-orange-500/10 rounded-2xl">
                                        {/* Image Area */}
                                        <div className="relative h-56 md:h-64 w-full overflow-hidden">
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
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/20 to-transparent opacity-80" />
                                            
                                            {/* Status Overlay */}
                                            <div className="absolute top-4 left-4">
                                                <div className="px-3 py-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Opérationnel</span>
                                                </div>
                                            </div>

                                            {restaurant.enVedette && (
                                                <div className="absolute top-4 right-4">
                                                    <div className="h-9 w-9 bg-orange-500 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                                                        <Star className="h-4 w-4 text-white fill-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-6 md:p-8 flex-grow flex flex-col">
                                            <div className="mb-5">
                                                <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-tight group-hover:text-orange-500 transition-colors duration-300">
                                                    {restaurant.nom}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 truncate">{restaurant.adresse || 'Emplacement non défini'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-2 mb-6 p-4 bg-white/3 border border-white/5 rounded-xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Cuisine</span>
                                                    <span className="text-xs font-black text-white uppercase italic tracking-wider">{restaurant.cuisine}</span>
                                                </div>
                                                <div className="h-8 w-[1px] bg-white/10" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Note</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-black text-white">{restaurant.note || '0.0'}</span>
                                                        <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex items-center gap-3 pt-5 border-t border-white/5">
                                                <Button 
                                                    variant="outline" 
                                                    asChild 
                                                    className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-orange-500 hover:border-orange-500 hover:text-white text-white transition-all duration-300 font-black uppercase tracking-tighter text-[11px] h-12"
                                                >
                                                    <Link href={`/dashboard/my-restaurants/edit?id=${restaurant.id}`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Modifier
                                                    </Link>
                                                </Button>

                                                {(() => {
                                                    const hasPlats = menuItems.some(p => p.restaurantId === restaurant.id);
                                                    
                                                    return (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    className="h-12 w-12 rounded-xl border border-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300"
                                                                    disabled={isDeleting === restaurant.id}
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="bg-[#121214]/95 backdrop-blur-2xl border border-white/10 text-white rounded-2xl max-w-md shadow-2xl">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-3xl flex items-center gap-3 text-white">
                                                                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                                                                        {hasPlats ? 'ALERTE CRITIQUE' : 'DISSOLUTION'}
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-white/50 font-medium pt-4 text-base leading-relaxed italic">
                                                                        {hasPlats ? (
                                                                            <>
                                                                                Cet établissement contient encore des créations culinaires actives. 
                                                                                <span className="block mt-4 text-white/80 font-bold uppercase tracking-widest text-xs">Veuillez purger le menu avant de pouvoir dissoudre cet établissement.</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Cette action est irréversible. Vous êtes sur le point de dissoudre 
                                                                                <strong className="text-white uppercase tracking-tighter"> {restaurant.nom}</strong> et d&apos;effacer son héritage numérique du registre Yakro.
                                                                            </>
                                                                        )}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className="mt-8 gap-3">
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
                                        {/* Hover glow line */}
                                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 group-hover:w-full transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-16 text-center shadow-2xl relative overflow-hidden rounded-3xl mt-12">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <UtensilsCrossed className="h-20 w-20 text-orange-500/20 mx-auto mb-8" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Empire Vierge</h2>
                        <p className="text-white/40 font-medium mb-10 text-base">
                            Aucun établissement n&apos;est encore enregistré sous votre bannière.
                        </p>
                    </div>
                )}

                {/* Desktop Action Button */}
                <div className="hidden md:flex justify-center mt-12">
                    <Button asChild className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic uppercase tracking-tighter text-lg shadow-[0_20px_40px_rgba(249,115,22,0.3)] transition-all duration-500 hover:scale-105 hover:shadow-[0_20px_60px_rgba(249,115,22,0.4)]">
                        <Link href="/dashboard/new-restaurant" className="flex items-center gap-3">
                            <Plus className="h-6 w-6" />
                            Établir un Restaurant
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Persistent FAB for Mobile — visibilité garantie */}
            <div className="fixed bottom-24 right-6 z-50 md:hidden">
                <Button asChild className="h-16 w-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_0_40px_rgba(249,115,22,0.6)] p-0 transition-all active:scale-90">
                    <Link href="/dashboard/new-restaurant" className="flex items-center justify-center">
                        <Plus className="h-8 w-8" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}