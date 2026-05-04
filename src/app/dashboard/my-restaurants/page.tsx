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
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

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
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <ChefHat className="h-4 w-4" />,
                badgeText: "Elite Management",
                title: <>Mes <span className="text-orange-500 italic">Établissements</span></>,
                subtitle: "Pilotez votre empire culinaire avec précision",
                backButtonHref: "/restaurateur",
                backButtonLabel: "Dashboard",
                children: (
                    <DashboardStats 
                        items={[
                            { label: "Actifs", value: myRestaurants.length, color: "orange" },
                            { label: "Opérations", value: "LIVE", color: "emerald" }
                        ]} 
                    />
                )
            }}
        >
            {myRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                                <div className="glass-dark border border-white/5 transition-all duration-500 group-hover:border-orange-500/50 overflow-hidden h-full flex flex-col shadow-2xl group-hover:shadow-orange-500/10 rounded-[1.25rem] md:rounded-[2rem]">
                                    {/* Image Area */}
                                    <div className="relative h-24 md:h-40 w-full overflow-hidden">
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
                                        <div className="absolute top-2.5 md:top-6 left-3 md:left-6">
                                            <div className="px-2 py-0.5 md:px-4 md:py-2 bg-[#0A0A0B]/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center gap-1.5 md:gap-2 shadow-2xl">
                                                <div className="h-1 w-1 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[6px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">LIVE</span>
                                            </div>
                                        </div>

                                        {restaurant.enVedette && (
                                            <div className="absolute top-2.5 md:top-6 right-3 md:right-6">
                                                <div className="h-6 w-6 md:h-10 md:w-10 bg-orange-500 flex items-center justify-center rounded-lg md:rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                                                    <Star className="h-2.5 w-2.5 md:h-5 md:w-5 text-white fill-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-4 md:p-6 flex-grow flex flex-col">
                                        <div className="mb-3 md:mb-4">
                                            <h3 className="text-lg md:text-2xl font-black italic uppercase tracking-tighter text-white leading-tight group-hover:text-orange-500 transition-colors duration-300">
                                                {restaurant.nom}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5 md:mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <MapPin className="h-2.5 w-2.5 text-orange-500" />
                                                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 line-clamp-1">{restaurant.adresse || 'Emplacement non défini'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-6 mt-1 md:mt-2 mb-2 md:mb-4 p-2.5 md:p-4 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-3xl">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">Cuisine</span>
                                                <span className="text-[9px] md:text-xs font-black text-white uppercase italic tracking-wider">{restaurant.cuisine}</span>
                                            </div>
                                            <div className="h-6 md:h-10 w-[1px] bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">Expertise</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs md:text-sm font-black text-white">{restaurant.note || '0.0'}</span>
                                                    <Star className="h-2 w-2 md:h-3 md:w-3 text-orange-500 fill-orange-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center gap-3 md:gap-4 pt-2 md:pt-4 border-t border-white/5">
                                            <Button 
                                                variant="outline" 
                                                asChild 
                                                className="flex-1 rounded-xl md:rounded-2xl border-white/10 bg-white/5 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-300 font-black uppercase tracking-tighter text-[9px] md:text-[11px] h-10 md:h-14"
                                            >
                                                <Link href={`/dashboard/my-restaurants/edit?id=${restaurant.id}`}>
                                                    <Edit className="h-3 w-3 mr-2" />
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
                                                                className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl border border-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
                                                                disabled={isDeleting === restaurant.id}
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="glass-dark border border-white/10 text-white rounded-[2rem] md:rounded-[2.5rem] max-w-md backdrop-blur-3xl shadow-2xl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-2xl md:text-3xl flex items-center gap-3 text-white">
                                                                    <AlertTriangle className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
                                                                    {hasPlats ? 'ALERTE CRITIQUE' : 'DISSOLUTION'}
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400 font-medium pt-3 md:pt-4 text-sm md:text-base leading-relaxed italic">
                                                                    {hasPlats ? (
                                                                        <>
                                                                            Cet établissement contient encore des créations culinaires actives. 
                                                                            <span className="block mt-3 md:mt-4 text-orange-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Veuillez purger le menu avant de pouvoir dissoudre cet établissement.</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            Cette action est irréversible. Vous êtes sur le point de dissoudre 
                                                                            <strong className="text-white uppercase tracking-tighter"> {restaurant.nom}</strong> et d&apos;effacer son héritage numérique du registre Yakro.
                                                                        </>
                                                                    )}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="mt-8 md:mt-10 gap-3 md:gap-4">
                                                                <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white uppercase font-bold tracking-widest text-[9px] md:text-[10px] h-10 md:h-12">ANNULER</AlertDialogCancel>
                                                                {hasPlats ? (
                                                                    <AlertDialogAction asChild className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white uppercase font-black tracking-widest text-[9px] md:text-[10px] h-10 md:h-12">
                                                                        <Link href="/dashboard/menu">GÉRER LE MENU</Link>
                                                                    </AlertDialogAction>
                                                                ) : (
                                                                    <AlertDialogAction 
                                                                        onClick={() => handleDelete(restaurant.id)}
                                                                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white uppercase font-black tracking-widest text-[9px] md:text-[10px] h-10 md:h-12"
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
                <div className="max-w-2xl mx-auto glass-dark border border-white/5 p-12 md:p-16 text-center shadow-2xl relative overflow-hidden rounded-[2rem] md:rounded-[3rem] mt-4 md:mt-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                    <div className="relative mb-6 md:mb-8">
                        <div className="absolute inset-0 bg-orange-500/10 blur-[50px] rounded-full scale-150" />
                        <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-orange-500/40 mx-auto relative z-10" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-3 md:mb-4">Empire Vierge</h2>
                    <p className="text-slate-500 font-medium mb-8 md:mb-10 text-base md:text-lg italic">
                        Aucun établissement n&apos;est encore enregistré sous votre bannière.
                    </p>
                </div>
            )}

            {/* Desktop Action Button */}
            <div className="hidden md:flex justify-center mt-8">
                <Button asChild className="h-14 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic uppercase tracking-tighter text-lg shadow-[0_20px_40px_rgba(249,115,22,0.2)] transition-all duration-500 hover:scale-105 active:scale-95 group">
                    <Link href="/dashboard/new-restaurant" className="flex items-center gap-4">
                        <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                        Établir un Restaurant
                    </Link>
                </Button>
            </div>

            {/* Persistent FAB for Mobile */}
            <div className="fixed bottom-8 right-6 z-50 md:hidden">
                <Button asChild className="h-16 w-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_20px_40px_rgba(249,115,22,0.4)] p-0 border-4 border-[#0A0A0B]">
                    <Link href="/dashboard/new-restaurant" className="flex items-center justify-center">
                        <Plus className="h-8 w-8" />
                    </Link>
                </Button>
            </div>
        </DashboardPage>
    );
}