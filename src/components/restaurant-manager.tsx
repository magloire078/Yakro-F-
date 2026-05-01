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
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useData } from '@/contexts/data-context';
import { Restaurant } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { logAdminAction } from '@/lib/audit-logs';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function RestaurantManager() {
    const { restaurants } = useData();
    const { db } = useFirebase();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleAction = async (restaurant: Restaurant, action: 'FEATURE_RESTAURANT' | 'SUSPEND_RESTAURANT') => {
        if (!user) return;

        try {
            await logAdminAction(db, {
                adminId: user.uid,
                adminEmail: user.email || 'unknown',
                action,
                targetId: restaurant.id,
                details: `${action === 'FEATURE_RESTAURANT' ? 'Mise en vedette' : 'Suspension'} du restaurant ${restaurant.nom}`
            });

            toast({
                title: "ORDRE EXÉCUTÉ",
                description: `Action tracée dans les registres d'audit Yakro.`,
                className: "bg-[#121214] border-orange-500 text-white font-black uppercase italic tracking-tighter"
            });
        } catch {
            toast({
                variant: 'destructive',
                title: "ÉCHEC CRITIQUE",
                description: "Interruption du protocole de gestion.",
                className: "bg-red-950 border-red-500 text-white font-black uppercase italic tracking-tighter"
            });
        }
    };

    return (
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#121214]/80 backdrop-blur-2xl rounded-none overflow-hidden border-t border-white/5">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <CardHeader className="p-10 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 border border-orange-500/20">
                                <Store className="h-5 w-5 text-orange-500" />
                            </div>
                            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                                Gestion des <span className="text-orange-500">Bastions</span>
                            </CardTitle>
                        </div>
                        <CardDescription className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Surveillance et modulation du réseau gastronomique Yakro.
                        </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-2 bg-white/5 border border-white/10 flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">CAPACITÉ RÉSEAU</span>
                            <span className="text-xl font-black italic text-white">{restaurants.length} UNITÉS</span>
                        </div>
                        <Button variant="outline" className="h-14 w-14 rounded-none bg-white/5 border-white/10 hover:bg-white/10 text-white">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader className="bg-black/20">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-6 px-10">IDENTIFIANT / UNITÉ</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-6">CATÉGORIE</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-6">INDICE DE PERFORMANCE</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-6">STATUT OPÉRATIONNEL</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-gray-500 py-6 px-10">COMMANDES</TableHead>
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
                                        className="group border-white/5 hover:bg-white/5 transition-all cursor-default"
                                    >
                                        <TableCell className="py-8 px-10">
                                            <div className="flex items-center gap-6">
                                                <div className="relative h-14 w-14 border border-white/10 group-hover:border-orange-500/50 transition-colors overflow-hidden">
                                                    <Image 
                                                        src={restaurant.image || `/assets/marketing/hero-food.png`}
                                                        alt={restaurant.nom}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="font-black text-base text-white uppercase italic tracking-tight group-hover:text-orange-500 transition-colors">{restaurant.nom}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest truncate">{restaurant.adresse || 'ZONE YAKRO CENTRALE'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-none border-orange-500/30 text-orange-500 bg-orange-500/5 text-[9px] font-black uppercase tracking-widest py-1.5 px-3">
                                                {restaurant.cuisine}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={cn("h-3 w-3", s <= Math.round(restaurant.note) ? "fill-orange-500 text-orange-500" : "fill-white/5 text-white/10")} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-black text-white italic">{restaurant.note.toFixed(1)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    LIVRAISON ESTIMÉE: {restaurant.tempsDeLivraison} MIN
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
                                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">OPÉRATIONNEL</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none hover:bg-orange-500/10 text-gray-500 hover:text-orange-500 border border-transparent hover:border-orange-500/20 transition-all">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-64 bg-[#121214] border-white/10 rounded-none p-1 shadow-3xl text-white">
                                                    <DropdownMenuItem className="rounded-none gap-3 font-black uppercase italic tracking-tighter text-xs py-4 focus:bg-orange-500 focus:text-white cursor-pointer transition-colors">
                                                        <ExternalLink className="h-4 w-4" />
                                                        Accéder à la Vitrine
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="rounded-none gap-3 font-black uppercase italic tracking-tighter text-xs py-4 focus:bg-green-600 focus:text-white cursor-pointer transition-colors"
                                                        onClick={() => handleAction(restaurant, 'FEATURE_RESTAURANT')}
                                                    >
                                                        <TrendingUp className="h-4 w-4" />
                                                        Propulser (En Vedette)
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <DropdownMenuItem 
                                                        className="rounded-none gap-3 font-black uppercase italic tracking-tighter text-xs py-4 focus:bg-red-600 focus:text-white cursor-pointer transition-colors text-red-500"
                                                        onClick={() => handleAction(restaurant, 'SUSPEND_RESTAURANT')}
                                                    >
                                                        <ShieldAlert className="h-4 w-4" />
                                                        Interruption de Service
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
            </CardContent>
            <div className="p-6 bg-black/20 flex justify-between items-center border-t border-white/5">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">PROTOCOL: BASTION-CONTROL-v2</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-none bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-widest px-4">PRÉCÉDENT</Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-none bg-white/5 border-white/10 text-[9px] font-black uppercase tracking-widest px-4">SUIVANT</Button>
                </div>
            </div>
        </Card>
    );
}
