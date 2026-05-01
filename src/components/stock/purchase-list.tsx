'use client';

import * as React from 'react';
import { StockItem, Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';
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
            <div className="bg-[#121214] border border-dashed border-white/10 p-20 text-center flex flex-col items-center justify-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-green-500/10 blur-2xl rounded-full scale-150" />
                    <Check className="h-12 w-12 text-green-500/30 relative" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 italic">Efficience Optimale</p>
                <p className="text-xs font-medium text-gray-500 mt-2">Tous vos stocks respectent les standards d&apos;excellence.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Logistique d&apos;Élite</span>
                    </div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        Plan de <span className="text-orange-500">Ravitaillement</span>
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Intelligence prédictive basée sur vos seuils de vigilance.</p>
                </div>
                <Button 
                    onClick={handleCopy}
                    className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-black italic uppercase tracking-tighter transition-all hover:scale-105 active:scale-95"
                >
                    {copied ? <Check className="mr-3 h-4 w-4 text-green-500" /> : <Copy className="mr-3 h-4 w-4 text-orange-500" />}
                    {copied ? 'Sécurisé' : 'Exporter la Liste'}
                </Button>
            </div>

            <div className="grid gap-6">
                <AnimatePresence mode="popLayout">
                    {lowStocks.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="bg-[#121214]/60 backdrop-blur-md border border-white/5 relative group overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${item.quantite === 0 ? 'bg-red-500' : 'bg-orange-500'}`} />
                                
                                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-14 w-14 border border-white/5 flex items-center justify-center transition-colors ${item.quantite === 0 ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                                            <AlertCircle className={`h-6 w-6 ${item.quantite === 0 ? 'text-red-500' : 'text-orange-500'}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter text-white italic group-hover:text-orange-500 transition-colors">{item.nom}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-1">{item.restaurantName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">État Actuel</p>
                                            <p className={`text-2xl font-black italic tracking-tighter ${item.quantite === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                                {item.quantite} <span className="text-[10px] uppercase tracking-normal font-bold opacity-60 ml-1">{item.unite}</span>
                                            </p>
                                        </div>
                                        <div className="h-10 w-px bg-white/5 hidden md:block" />
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-black text-orange-500 tracking-[0.2em] mb-1">Cible Elite</p>
                                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 rounded-none text-xs px-4 py-1 font-black italic">
                                                + {item.suggestedQty} {item.unite}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Decorative overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-8 bg-orange-500/5 border border-orange-500/10 flex items-start gap-6 group">
                <div className="h-12 w-12 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-orange-500" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Intelligence Logistique Yakro</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed italic">
                        &ldquo;Ce plan de ravitaillement est calculé pour restaurer un stock de sécurité optimal correspondant à 3 cycles opérationnels. Exportez cette liste vers vos partenaires logistiques pour maintenir l&apos;excellence de votre service.&rdquo;
                    </p>
                </div>
            </div>
        </div>
    );
}
