'use client';

import * as React from 'react';
import {
    Bike,
    MoreHorizontal,
    Filter,
    Trash2,
    Loader,
    Navigation2,
    Activity,
    UserX,
    MapPin,
    Map as MapIcon,
    LayoutList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { UserProfile, Order } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/lib/audit-logs';
import { TacticalMap } from '@/components/tactical-map';

interface LivreurManagerProps {
    users: UserProfile[];
    orders: Order[];
}

export function LivreurManager({ users, orders }: LivreurManagerProps) {
    const { updateOtherUserProfile, user: adminUser } = useAuth();
    const { db } = useFirebase();
    const { toast } = useToast();
    const [searchTerm] = React.useState('');
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
    const [view, setView] = React.useState<'list' | 'map'>('list');

    const livreurs = React.useMemo(() => {
        return users.filter(u => u.role === 'livreur')
            .filter(u => 
                (u.nom?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [users, searchTerm]);

    const getActiveOrdersCount = (livreurId: string) => {
        return orders.filter(o => o.livreurId === livreurId && o.statut === 'En Route').length;
    };

    const handleToggleSuspension = async (livreur: UserProfile) => {
        if (!adminUser) return;
        setIsUpdating(livreur.uid);
        
        // UserProfile has no `suspendu` field yet — toggle `statutService` as
        // a proxy. Replace once the dedicated field lands.
        try {
            const newStatus = livreur.statutService === 'Hors service' ? 'En service' : 'Hors service';
            await updateOtherUserProfile(livreur.uid, { statutService: newStatus });
            
            await logAdminAction(db, {
                adminId: adminUser.uid,
                adminEmail: adminUser.email || 'unknown',
                action: 'UPDATE_USER',
                targetId: livreur.uid,
                details: `Changement statut service livreur ${livreur.email} vers ${newStatus}`
            });

            toast({
                title: "STATUT MIS À JOUR",
                description: `Le livreur est désormais ${newStatus}.`,
                className: "bg-card border-orange-500 text-foreground font-black uppercase italic tracking-tighter"
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "ÉCHEC CRITIQUE",
                description: "Impossible de modifier le statut du livreur.",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <div className="bg-card/40 backdrop-blur-3xl border border-border/50 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <Bike className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                            Gestion des <span className="text-orange-500 italic">Livreurs</span>
                        </h2>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        SUPERVISION DES UNITÉS MOBILES ET FLUX DE TRANSIT
                    </p>
                </div>
                    
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="px-6 py-3 bg-card/50 border border-border/50 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">UNITÉS ACTIVES</span>
                        <span className="text-xl font-black italic text-foreground">{livreurs.filter(l => l.statutService === 'En service').length} EN LIGNE</span>
                    </div>

                    <div className="flex items-center gap-1 bg-card/50 p-1 border border-border/50 rounded-2xl">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setView('list')}
                            className={cn(
                                "h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                                view === 'list' ? "bg-orange-500 text-white shadow-lg" : "text-slate-500 hover:bg-orange-500/10"
                            )}
                        >
                            <LayoutList className="h-4 w-4 mr-2" />
                            Liste
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setView('map')}
                            className={cn(
                                "h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                                view === 'map' ? "bg-orange-500 text-white shadow-lg" : "text-slate-500 hover:bg-orange-500/10"
                            )}
                        >
                            <MapIcon className="h-4 w-4 mr-2" />
                            Tactique
                        </Button>
                    </div>

                    <Button variant="outline" className="h-14 w-14 rounded-2xl bg-card/50 border-border/50 hover:bg-orange-500/10 hover:text-orange-500 text-foreground transition-all">
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="overflow-x-auto scrollbar-hide"
                        >
                            <Table>
                                <TableHeader className="border-border/50">
                                    <TableRow className="border-border/50 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6 px-4">Livreur / Unité</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">État de Service</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Flux Actif</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Localisation</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-40 py-6 px-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {livreurs.map((livreur, idx) => (
                                            <motion.tr 
                                                key={livreur.uid}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group border-border/50 hover:bg-card/50 transition-all cursor-default"
                                            >
                                                <TableCell className="py-6 px-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12 rounded-2xl border border-border group-hover:border-orange-500/30 transition-all group-hover:scale-110 shadow-lg">
                                                            <AvatarFallback className="bg-card dark:bg-white/10 text-xs font-black text-orange-500">{getInitials(livreur.nom || livreur.email)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <span className="font-black text-sm text-foreground uppercase italic tracking-tight group-hover:text-orange-500 transition-colors">{livreur.nom || 'UNITÉ ANONYME'}</span>
                                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest truncate">{livreur.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full shadow-[0_0_10px]",
                                                            livreur.statutService === 'En service' ? "bg-green-500 shadow-green-500 animate-pulse" : "bg-red-500 shadow-red-500"
                                                        )} />
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest",
                                                            livreur.statutService === 'En service' ? "text-green-500" : "text-red-500"
                                                        )}>
                                                            {livreur.statutService || 'HORS SERVICE'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-3 w-3 text-orange-500/50" />
                                                        <span className="text-[10px] font-black text-foreground italic">{getActiveOrdersCount(livreur.uid)} EN COURS</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    {livreur.latitude && livreur.longitude ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                <MapPin className="h-2.5 w-2.5 text-orange-500" />
                                                                {livreur.latitude.toFixed(4)}, {livreur.longitude.toFixed(4)}
                                                            </div>
                                                            <Button variant="link" onClick={() => setView('map')} className="h-auto p-0 text-[8px] font-black text-orange-500 uppercase tracking-widest justify-start">
                                                                VOIR SUR CARTE
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic opacity-50">NON LOCALISÉ</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-6 px-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-orange-500/10 text-slate-500 hover:text-orange-500 border border-transparent hover:border-orange-500/20 transition-all hover:scale-110">
                                                                <MoreHorizontal className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-3xl border-border/50 rounded-2xl p-1 shadow-2xl text-foreground overflow-hidden">
                                                            <DropdownMenuItem 
                                                                className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-orange-500 focus:text-white cursor-pointer transition-colors"
                                                                onClick={() => handleToggleSuspension(livreur)}
                                                                disabled={isUpdating === livreur.uid}
                                                            >
                                                                {isUpdating === livreur.uid ? <Loader className="h-4 w-4 animate-spin" /> : <Navigation2 className="h-4 w-4" />}
                                                                {livreur.statutService === 'En service' ? 'Désactiver le Service' : 'Forcer Activation'}
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-border/50 my-1" />
                                                            <DropdownMenuItem className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-red-600 focus:text-white cursor-pointer transition-colors text-red-500">
                                                                <UserX className="h-4 w-4" />
                                                                Suspendre Compte
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-border/50 my-1" />
                                                            <DropdownMenuItem className="rounded-xl gap-3 font-black uppercase italic tracking-tighter text-[10px] py-4 focus:bg-red-700 focus:text-white cursor-pointer transition-colors text-red-600">
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
                        </motion.div>
                    ) : (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <TacticalMap users={users} orders={orders} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-8 bg-card/30 flex justify-between items-center border-t border-border/50 relative z-10 mt-6">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Protocol: COURIER-TRACK-v4.0</span>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card/50 border-border/50 text-[9px] font-black uppercase tracking-widest px-6 hover:bg-card transition-all">PRÉCÉDENT</Button>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card/50 border-border/50 text-[9px] font-black uppercase tracking-widest px-6 hover:bg-card transition-all">SUIVANT</Button>
                </div>
            </div>
        </div>
    );
}
