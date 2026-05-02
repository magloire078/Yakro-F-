'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { DollarSign, Bike, TrendingUp, History, ShieldCheck, MapPin, Navigation2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { MobileBackButton } from '@/components/mobile-back-button';
import { motion, AnimatePresence } from 'framer-motion';

export default function EarningsPage() {
    const { user, activeRole } = useAuth();
    const router = useRouter();
    const { orders } = useData();
    
    React.useEffect(() => {
        if (user && activeRole !== 'livreur') {
            router.push('/');
        }
    }, [user, activeRole, router]);
    
    const myCompletedDeliveries = React.useMemo(() => {
        if (!user || activeRole !== 'livreur') return [];
        return orders
            .filter(o => o.livreurId === user.uid && o.statut === 'Livrée')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, user, activeRole]);

    const stats = React.useMemo(() => {
        const totalEarnings = myCompletedDeliveries.reduce((sum, order) => sum + order.fraisDeLivraison, 0);
        const completedCount = myCompletedDeliveries.length;
        const averageEarning = completedCount > 0 ? totalEarnings / completedCount : 0;
        
        return {
            totalEarnings,
            completedCount,
            averageEarning,
        };
    }, [myCompletedDeliveries]);
    
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white pb-24 relative overflow-hidden">
            {/* Elite Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]" />
            </div>

            {/* Elite Header */}
            <div className="relative h-[45vh] w-full overflow-hidden flex items-center justify-center pt-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop"
                        alt="Delivery Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0B]/80 to-[#0A0A0B] z-10" />
                </div>
                
                <div className="absolute top-6 left-6 z-50">
                    <MobileBackButton />
                </div>

                <div className="relative z-30 text-center space-y-6 px-6 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 backdrop-blur-md mb-2"
                    >
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Elite Certified Status</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] mb-4"
                    >
                        Mes <span className="text-orange-500">Revenus</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs italic"
                    >
                        Flux de trésorerie et performances logistiques.
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl -mt-16 relative z-40 space-y-12">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Revenus Totaux', value: stats.totalEarnings, sub: 'Cumul des frais de livraison', icon: DollarSign, color: 'orange' },
                        { label: 'Missions Validées', value: stats.completedCount, sub: 'Livraisons effectuées', icon: Bike, color: 'white', unit: 'Courses' },
                        { label: 'Efficacité Moyenne', value: stats.averageEarning, sub: 'Gain moyen par trajet', icon: TrendingUp, color: 'white' }
                    ].map((item, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/20"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-orange-500 transition-colors">{item.label}</span>
                                <div className={`p-3 ${item.color === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-gray-500'} transition-transform duration-500`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-black italic tracking-tighter ${item.color === 'orange' ? 'text-orange-500' : 'text-white'}`}>
                                    {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    {item.unit || 'FCFA'}
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-4 italic">{item.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* History Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#121214]/60 backdrop-blur-md border border-white/5 p-8 md:p-12 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Journal des <span className="text-orange-500">Missions</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mt-2 italic">Historique complet des opérations validées</p>
                        </div>
                        <div className="bg-white/5 p-4 border border-white/5">
                            <History className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {myCompletedDeliveries.length > 0 ? (
                            <div className="relative">
                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader className="border-white/5">
                                            <TableRow className="hover:bg-transparent border-white/5">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-600 py-6">Opération</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-600 py-6">Établissement</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-600 py-6 text-center">Statut</TableHead>
                                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-gray-600 py-6">Rémunération</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myCompletedDeliveries.map((order, index) => (
                                                <motion.tr 
                                                    key={order.id} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-white/5 hover:bg-white/5 transition-colors group"
                                                >
                                                    <TableCell className="py-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-black italic text-white uppercase">{new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Ref. #{order.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/30 transition-colors">
                                                                <MapPin className="h-5 w-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                                                            </div>
                                                            <span className="font-black italic text-white text-lg uppercase">{order.nomRestaurant}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-8 text-center">
                                                        <Badge className="rounded-none bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-1 font-black italic text-[10px] tracking-tight uppercase">
                                                            Validée
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right py-8">
                                                        <span className="text-2xl font-black italic tracking-tighter text-orange-500">
                                                            +{order.fraisDeLivraison.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60">FCFA</span>
                                                        </span>
                                                    </TableCell>
                                                </motion.tr>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-6">
                                    {myCompletedDeliveries.map((order, index) => (
                                        <motion.div 
                                            key={order.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white/5 border border-white/5 p-6 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-500/0 group-hover:bg-orange-500/30 transition-colors" />
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{new Date(order.date).toLocaleDateString('fr-FR')}</span>
                                                    <span className="font-black italic text-white uppercase text-xs">Mission #{order.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <Badge className="rounded-none bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-0.5 font-black italic text-[8px] tracking-tight uppercase">
                                                    Validée
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white/5 flex items-center justify-center border border-white/10">
                                                        <Navigation2 className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                    <span className="font-black italic text-white text-sm uppercase truncate max-w-[150px]">{order.nomRestaurant}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-black italic tracking-tighter text-orange-500">
                                                        +{order.fraisDeLivraison.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60">F</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 text-center flex flex-col items-center gap-8"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="bg-white/5 p-8 border border-white/10 relative">
                                        <Bike className="h-16 w-16 text-gray-800" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Aucune Activité</h3>
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] max-w-xs mx-auto italic">
                                        Rejoignez le réseau de livraison et validez votre première course.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                {/* Branding Footer */}
                <div className="text-center pt-10 pb-20 opacity-20 group hover:opacity-40 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 italic">
                        Yakro Logistics Elite &bull; Excellence Opérationnelle
                    </p>
                </div>
            </div>
        </div>
    );
}
