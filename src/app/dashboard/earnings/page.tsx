'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { DollarSign, Bike, TrendingUp, History, ShieldCheck, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { MobileBackButton } from '@/components/mobile-back-button';

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
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-500/5 to-transparent" />

            {/* Elite Earnings Header */}
            <div className="relative h-[30vh] md:h-[40vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop"
                        alt="Delivery Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-black/60 z-10" />
                </div>
                
                <MobileBackButton />

                <div className="relative z-30 text-center space-y-4 md:space-y-6 px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-2 animate-fade-in-up">
                        <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Statut Elite Certifié</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white italic leading-none animate-fade-in-up delay-100">
                        Mes <span className="text-orange-500">Revenus</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-xl mx-auto text-sm md:text-lg animate-fade-in-up delay-200">
                        Gérez vos profits et suivez l&apos;évolution de votre activité de livraison haute performance.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-10 relative z-40 space-y-10">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { label: 'Revenus Totaux', value: stats.totalEarnings, sub: 'Cumul des frais de livraison', icon: DollarSign, color: 'orange' },
                        { label: 'Missions Validées', value: stats.completedCount, sub: 'Livraisons effectuées', icon: Bike, color: 'white', unit: 'COURSES' },
                        { label: 'Efficacité Moyenne', value: stats.averageEarning, sub: 'Gain moyen par trajet', icon: TrendingUp, color: 'white' }
                    ].map((item, idx) => (
                        <div 
                            key={idx} 
                            className="group bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden transition-all duration-500 hover:border-orange-500/30"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-orange-500 transition-colors">{item.label}</span>
                                <div className={`p-2 bg-white/5 rounded-none border border-white/5 group-hover:border-orange-500/30 transition-all`}>
                                    <item.icon className={`h-4 w-4 ${item.color === 'orange' ? 'text-orange-500' : 'text-white'}`} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black tracking-tighter ${item.color === 'orange' ? 'text-orange-500' : 'text-white'}`}>
                                    {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    {item.unit || 'FCFA'}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-gray-600 uppercase mt-4 tracking-widest">{item.sub}</p>
                        </div>
                    ))}
                </div>

                {/* History Section */}
                <div className="bg-[#121214]/60 backdrop-blur-md border border-white/5 p-8 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Journal des <span className="text-orange-500">Missions</span></h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Historique complet de vos performances</p>
                        </div>
                        <History className="h-6 w-6 text-gray-700" />
                    </div>

                    {myCompletedDeliveries.length > 0 ? (
                        <div className="relative">
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="border-white/5">
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Date d&apos;Opération</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Établissement</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6 text-center">Statut</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Rémunération</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myCompletedDeliveries.map(order => (
                                            <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-sm text-white">{new Date(order.date).toLocaleDateString('fr-FR')}</span>
                                                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">ID #{order.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-colors">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                                                        </div>
                                                        <span className="font-black text-sm uppercase tracking-tight text-gray-300">{order.nomRestaurant}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 text-center">
                                                    <Badge className="rounded-none bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 font-black uppercase text-[8px] tracking-widest">
                                                        Validée
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-6">
                                                    <span className="text-lg font-black tracking-tighter text-orange-500">
                                                        +{order.fraisDeLivraison.toLocaleString('fr-FR')} <span className="text-[10px] opacity-40">F</span>
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {myCompletedDeliveries.map(order => (
                                    <div 
                                        key={order.id} 
                                        className="bg-white/[0.02] border border-white/5 p-5 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Session du {new Date(order.date).toLocaleDateString('fr-FR')}</span>
                                                <span className="font-black text-xs text-white uppercase tracking-tight">#{order.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <Badge className="rounded-none bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 font-black uppercase text-[7px] tracking-widest">
                                                Validée
                                            </Badge>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 bg-white/5 flex items-center justify-center border border-white/5">
                                                    <MapPin className="h-3 w-3 text-gray-500" />
                                                </div>
                                                <span className="font-black text-[11px] uppercase tracking-wider text-gray-300">{order.nomRestaurant}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Rémunération</p>
                                                <span className="text-lg font-black tracking-tighter text-orange-500">
                                                    +{order.fraisDeLivraison.toLocaleString('fr-FR')} <span className="text-[10px] opacity-40">F</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center border border-dashed border-white/5 flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-full scale-150" />
                                <Bike className="h-16 w-16 text-gray-800 relative" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Aucune Activité Détectée</p>
                                <p className="text-xs font-medium text-gray-500 max-w-xs mx-auto">
                                    Rejoignez le réseau de livraison et validez votre première course pour voir vos profits s&apos;afficher ici.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Branding Footer */}
                <div className="text-center pt-10 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">
                        Yakro Logistics Elite &bull; Excellence Opérationnelle
                    </p>
                </div>
            </div>
        </div>
    );
}
