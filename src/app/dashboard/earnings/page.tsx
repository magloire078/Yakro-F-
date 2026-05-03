'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    DollarSign, 
    Bike, 
    TrendingUp, 
    History, 
    MapPin, 
    Navigation2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

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
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <ShieldCheck className="h-4 w-4" />,
                badgeText: "Elite Certified Status",
                title: <>Mes <span className="text-orange-500 italic">Revenus</span></>,
                subtitle: "Flux de trésorerie et performances logistiques",
                backButtonHref: "/livreur",
                children: (
                    <DashboardStats 
                        items={[
                            { label: "Total", value: stats.totalEarnings.toLocaleString('fr-FR'), color: "orange" },
                            { label: "Missions", value: stats.completedCount, color: "white" }
                        ]} 
                    />
                )
            }}
        >
            <div className="space-y-6 md:space-y-10">
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
                            className="group glass-dark border border-white/5 p-4 md:p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/50 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-orange-500 transition-colors">{item.label}</span>
                                <div className={cn(
                                    "p-3 rounded-xl transition-transform duration-500",
                                    item.color === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-muted-foreground'
                                )}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-3xl md:text-4xl font-black italic tracking-tighter",
                                    item.color === 'orange' ? 'text-orange-500' : 'text-white'
                                )}>
                                    {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {item.unit || 'FCFA'}
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 italic">{item.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* History Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-dark border border-white/5 p-5 md:p-10 relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Journal des <span className="text-orange-500">Missions</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2 italic">Historique complet des opérations validées</p>
                        </div>
                        <div className="bg-white/5 p-4 border border-white/10 rounded-2xl">
                            <History className="h-6 w-6 text-orange-500" />
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
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-6">Opération</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-6">Établissement</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-6 text-center">Statut</TableHead>
                                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-6">Rémunération</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myCompletedDeliveries.map((order, index) => (
                                                <motion.tr 
                                                    key={order.id} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    <TableCell className="py-4 md:py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black italic text-white uppercase">{new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ref. #{order.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 md:py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-orange-500/30 transition-colors">
                                                                <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                                                            </div>
                                                            <span className="font-black italic text-white text-lg uppercase">{order.nomRestaurant}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-6 text-center">
                                                        <Badge className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 font-black italic text-[10px] tracking-tight uppercase">
                                                            Validée
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 md:py-6">
                                                        <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-orange-500">
                                                            +{order.fraisDeLivraison.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60">FCFA</span>
                                                        </span>
                                                    </TableCell>
                                                </motion.tr>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {myCompletedDeliveries.map((order, index) => (
                                        <motion.div 
                                            key={order.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="glass border border-white/5 p-6 relative overflow-hidden group rounded-2xl"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{new Date(order.date).toLocaleDateString('fr-FR')}</span>
                                                    <span className="font-black italic text-white uppercase text-xs">Mission #{order.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <Badge className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 font-black italic text-[8px] tracking-tight uppercase">
                                                    Validée
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
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
                                className="py-24 text-center flex flex-col items-center gap-8"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="bg-white/5 p-10 border border-white/10 relative rounded-[2rem]">
                                        <Bike className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Aucune Activité</h3>
                                    <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] max-w-xs mx-auto italic">
                                        Rejoignez le réseau de livraison et validez votre première course.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                

            </div>
        </DashboardPage>
    );
}
