'use client';

import * as React from 'react';
import {
    Bike,
    Navigation2,
    Zap,
    Crosshair,
    Activity,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Order, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface TacticalMapProps {
    users: UserProfile[];
    orders: Order[];
}

export function TacticalMap({ users, orders }: TacticalMapProps) {
    const [selectedLivreur, setSelectedLivreur] = React.useState<UserProfile | null>(null);
    const [isRadarActive, setIsRadarActive] = React.useState(true);

    const livreurs = React.useMemo(() => {
        return users.filter(u => u.role === 'livreur' && u.statutService === 'En service' && u.latitude && u.longitude);
    }, [users]);

    // Bounding box pour Yamoussoukro (approximation pour le rendu)
    const bounds = {
        minLat: 6.8,
        maxLat: 6.9,
        minLong: -5.3,
        maxLong: -5.2
    };

    const projectToMap = (lat: number, lng: number) => {
        const x = ((lng - bounds.minLong) / (bounds.maxLong - bounds.minLong)) * 100;
        const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
        return { x, y };
    };

    return (
        <div className="w-full h-[650px] bg-background/40 glass border border-foreground/10 relative overflow-hidden flex rounded-[2.5rem] shadow-3xl">
            {/* Main Map Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Tactical Grid Background */}
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[length:40px_40px] text-orange-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
                
                {/* Scanning Radar Effect */}
                {isRadarActive && (
                    <motion.div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] border border-orange-500/10 rounded-full"
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                )}

                <svg viewBox="0 0 800 600" className="w-full h-full fill-none absolute inset-0 pointer-events-none">
                    {/* Concentric Circles */}
                    <circle cx="400" cy="300" r="100" className="stroke-orange-500/10" strokeDasharray="10 10" />
                    <circle cx="400" cy="300" r="200" className="stroke-orange-500/5" strokeDasharray="5 5" />
                    <circle cx="400" cy="300" r="300" className="stroke-foreground/[0.02]" />
                    
                    {/* Active Delivery Paths */}
                    {orders.filter(o => o.statut === 'En Route' && o.livreurId).map(order => {
                        const livreur = livreurs.find(l => l.uid === order.livreurId);
                        if (!livreur || !livreur.latitude || !livreur.longitude || !order.latitudeClient || !order.longitudeClient) return null;
                        
                        const start = projectToMap(livreur.latitude, livreur.longitude);
                        const end = projectToMap(order.latitudeClient, order.longitudeClient);

                        return (
                            <g key={`path-${order.id}`}>
                                <motion.line
                                    x1={`${start.x}%`}
                                    y1={`${start.y}%`}
                                    x2={`${end.x}%`}
                                    y2={`${end.y}%`}
                                    className="stroke-orange-500/30"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                />
                                <motion.circle
                                    r="2"
                                    fill="#F97316"
                                    animate={{ 
                                        cx: [`${start.x}%`, `${end.x}%`],
                                        cy: [`${start.y}%`, `${end.y}%`]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Livreur Markers */}
                {livreurs.map((livreur) => {
                    const pos = projectToMap(livreur.latitude!, livreur.longitude!);
                    const isActive = selectedLivreur?.uid === livreur.uid;
                    const activeOrders = orders.filter(o => o.livreurId === livreur.uid && o.statut === 'En Route');

                    return (
                        <motion.div
                            key={livreur.uid}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute"
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            onClick={() => setSelectedLivreur(livreur)}
                        >
                            <div className="relative -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                                {activeOrders.length > 0 && (
                                    <motion.div 
                                        className="absolute inset-0 bg-orange-500/40 rounded-none rotate-45"
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}

                                <div className={cn(
                                    "h-6 w-6 rounded-none border border-background flex items-center justify-center rotate-45 group-hover:scale-125 transition-transform relative z-10",
                                    isActive ? "bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,1)]" : "bg-white/10 dark:bg-white/20 hover:bg-orange-500/50"
                                )}>
                                    <Bike className={cn("h-3.5 w-3.5 -rotate-45", isActive ? "text-white" : "text-orange-500")} />
                                </div>
                                
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                                    <div className="glass p-4 border border-white/10 rounded-none shadow-3xl min-w-[200px]">
                                        <div className="text-[10px] font-black uppercase italic tracking-tighter text-orange-500 mb-1">UNITÉ DÉPLOYÉE</div>
                                        <div className="text-sm font-headline font-bold tracking-tight uppercase mb-2">{livreur.nom || 'Anonyme'}</div>
                                        <div className="h-px bg-white/5 mb-2" />
                                        <div className="flex items-center justify-between text-[9px] font-body font-bold text-gray-500 uppercase tracking-widest">
                                            <span>Missions actives:</span>
                                            <span className="text-orange-500">{activeOrders.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Floating Map Controls */}
                <div className="absolute top-8 left-8 space-y-4">
                    <div className="glass p-6 border border-white/5 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-headline font-bold uppercase tracking-wider">PROTOCOLE YAM-EYE v2.0</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-10">
                                <span className="text-[9px] font-body font-bold text-gray-600 uppercase tracking-widest">SIGNAL</span>
                                <span className="text-[9px] font-headline font-bold text-green-500">OPTIMAL</span>
                            </div>
                            <div className="flex items-center justify-between gap-10">
                                <span className="text-[9px] font-body font-bold text-muted-foreground uppercase tracking-widest">ACTIFS</span>
                                <span className="text-[9px] font-headline font-bold">{livreurs.length} UNITÉS</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 right-8 flex gap-4 glass p-4 border border-white/5">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsRadarActive(!isRadarActive)}
                        className={cn("h-10 w-10 rounded-xl", isRadarActive ? "text-orange-500 bg-orange-500/10" : "text-slate-500")}
                    >
                        <Activity className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500">
                        <Crosshair className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Sidebar Details */}
            <div className="w-80 border-l border-white/5 glass flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-[11px] font-headline font-bold uppercase tracking-widest text-orange-500">Flux Tactique Live</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {selectedLivreur ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Navigation2 className="h-12 w-12 text-orange-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                            <Bike className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-headline font-bold tracking-tight uppercase">{selectedLivreur.nom}</div>
                                            <div className="text-[9px] font-body font-bold text-orange-500/70 tracking-widest uppercase">Unité de Transit Alpha</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex justify-between text-[10px] font-body font-bold uppercase tracking-widest opacity-60">
                                            <span>Missions</span>
                                            <span className="text-foreground">{orders.filter(o => o.livreurId === selectedLivreur.uid && o.statut === 'En Route').length} active(s)</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-body font-bold uppercase tracking-widest opacity-60">
                                            <span>Secteur</span>
                                            <span className="text-foreground">YAM-CENTRE</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-6 h-12 rounded-2xl border-orange-500/20 hover:bg-orange-500 hover:text-white font-headline font-bold text-[10px] tracking-widest transition-all"
                                        onClick={() => setSelectedLivreur(null)}
                                    >
                                        RETOUR AU FLUX GLOBAL
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {livreurs.length > 0 ? livreurs.map(l => (
                                    <motion.div
                                        key={l.uid}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-orange-500/30 cursor-pointer transition-colors group"
                                        onClick={() => setSelectedLivreur(l)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <span className="text-[10px] font-headline font-bold uppercase tracking-tight">{l.nom || 'Anonyme'}</span>
                                            </div>
                                            <Info className="h-3 w-3 text-slate-500 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                        <Activity className="h-12 w-12 mb-4 animate-pulse" />
                                        <div className="text-[10px] font-headline font-bold uppercase tracking-widest">Aucune unité active</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="p-6 bg-white/[0.02] border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                        <span className="text-[9px] font-body font-bold text-gray-500 uppercase tracking-widest">SYSTÈME DE LOCALISATION ACTIF</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
