'use client';

import * as React from 'react';
import { StockItem, Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Copy, Check, AlertCircle, Sparkles, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseListProps {
    stocks: StockItem[];
    restaurants: Restaurant[];
}

export function PurchaseList({ stocks, restaurants }: PurchaseListProps) {
    const [copied, setCopied] = React.useState(false);

    const lowStocks = React.useMemo(() => {
        return stocks.filter(item => item.quantite <= item.seuilAlerte)
            .map(item => {
                const restau = restaurants.find(r => r.id === item.restaurantId);
                const suggestedQty = Math.max(0, (item.seuilAlerte * 3) - item.quantite);
                return { ...item, restaurantName: restau?.nom || 'Inconnu', suggestedQty };
            });
    }, [stocks, restaurants]);

    const handleCopy = () => {
        if (lowStocks.length === 0) return;

        const text = lowStocks.map(item => 
            `- ${item.nom} (${item.restaurantName}) : Commander ${item.suggestedQty} ${item.unite} (Stock actuel: ${item.quantite})`
        ).join('\n');

        const fullMessage = `🛒 *LISTE DE RÉAPPROVISIONNEMENT - YAKRO GO*\n\n${text}\n\nGénéré le ${new Date().toLocaleDateString('fr-FR')}`;

        navigator.clipboard.writeText(fullMessage);
        setCopied(true);
        toast({ title: "Journal d'Acquisition", description: "La liste a été sécurisée dans le presse-papier." });
        setTimeout(() => setCopied(false), 2000);
    };

    if (lowStocks.length === 0) {
        return (
            <div className="bg-white/5 backdrop-blur-xl border border-dashed border-white/10 p-24 rounded-[3rem] text-center flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-1000" />
                    <div className="h-20 w-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-inner relative">
                        <Check className="h-10 w-10 text-emerald-500 transition-transform group-hover:scale-110" />
                    </div>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 italic mb-2">Efficience Optimale</p>
                <p className="text-lg font-black italic text-white tracking-tighter">
                    Tous vos stocks respectent les standards d&apos;excellence. <br />
                    <span className="text-emerald-500 underline decoration-2 underline-offset-4 decoration-emerald-500/20">Zéro Rupture</span> détectée.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-3">
                        <div className="h-8 w-8 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
                            <ShoppingCart className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Logistique d&apos;Élite</span>
                    </div>
                    <h3 className="text-4xl font-black italic tracking-tighter text-white leading-none">
                        Plan de <span className="text-orange-500">Ravitaillement</span>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Intelligence prédictive basée sur vos seuils de vigilance.</p>
                </div>
                <Button 
                    onClick={handleCopy}
                    className="h-16 px-10 bg-white text-[#0A0A0B] hover:bg-white/90 rounded-2xl font-black italic tracking-tight text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 group"
                >
                    {copied ? (
                        <Check className="mr-3 h-5 w-5 text-emerald-600 animate-in zoom-in" />
                    ) : (
                        <Copy className="mr-3 h-5 w-5 text-orange-500 group-hover:rotate-12 transition-transform" />
                    )}
                    {copied ? 'Liste Sécurisée' : 'Exporter le Plan'}
                </Button>
            </div>

            <div className="grid gap-8">
                <AnimatePresence mode="popLayout">
                    {lowStocks.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] relative group overflow-hidden shadow-2xl hover:border-orange-500/20 transition-all">
                                <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${item.quantite === 0 ? 'bg-red-500' : 'bg-orange-500'}`} />
                                
                                <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="flex items-center gap-8">
                                        <div className={`h-20 w-20 border rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 ${item.quantite === 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                            <AlertCircle className={`h-10 w-10 ${item.quantite === 0 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-3xl font-black italic tracking-tighter text-white leading-none group-hover:text-orange-500 transition-colors">
                                                {item.nom}
                                            </h4>
                                            <div className="flex items-center gap-2 text-white/30">
                                                <MapPin className="h-3 w-3 text-orange-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">{item.restaurantName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12 md:gap-20">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] mb-2">État Actuel</p>
                                            <p className={`text-4xl font-black italic tracking-tighter leading-none ${item.quantite === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                                {item.quantite} <span className="text-xs uppercase tracking-normal font-bold opacity-40 ml-1">{item.unite}</span>
                                            </p>
                                        </div>
                                        <div className="h-16 w-px bg-white/5 hidden md:block" />
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-orange-500 tracking-[0.2em] mb-2">Cible Recommandée</p>
                                            <div className="inline-flex items-center h-10 px-6 bg-orange-500 text-white rounded-xl text-sm font-black italic shadow-lg shadow-orange-500/20">
                                                + {item.suggestedQty} {item.unite}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Decorative overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group">
                {/* Decorative background scanline */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                
                <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" />
                </div>
                <div className="space-y-3 relative z-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-orange-500">Intelligence Logistique Yakro</h4>
                    <p className="text-sm font-bold text-white/40 leading-relaxed italic uppercase tracking-wider">
                        &ldquo;Ce plan est calculé pour restaurer un stock de sécurité optimal correspondant à <span className="text-white italic">3 cycles opérationnels</span>. Exportez cette liste pour maintenir l&apos;excellence.&rdquo;
                    </p>
                </div>
            </div>
        </div>
    );
}
