'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { 
    isWithinInterval, 
    startOfDay, 
    startOfWeek, 
    startOfMonth, 
    startOfYear, 
    endOfDay 
} from 'date-fns';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBackButton } from '@/components/mobile-back-button';
import { cn } from '@/lib/utils';

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export default function AnalyticsPage() {
    const { user, activeRole } = useAuth();
    const router = useRouter();
    const { orders, restaurants } = useData();
    const [selectedRange, setSelectedRange] = React.useState<TimeRange>('all');
    
    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, activeRole, router]);

    const myRestaurantIds = React.useMemo(() => {
        if (activeRole !== 'restaurateur' || !user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid).map(r => r.id);
    }, [restaurants, activeRole, user]);

    const filteredOrders = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        
        const baseOrders = orders.filter(o => myRestaurantIds.includes(o.restaurantId) && o.statut === 'Livrée');
        
        if (selectedRange === 'all') return baseOrders;

        const now = new Date();
        let startDate: Date;

        switch (selectedRange) {
            case 'today':
                startDate = startOfDay(now);
                break;
            case 'week':
                startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                break;
            case 'month':
                startDate = startOfMonth(now);
                break;
            case 'year':
                startDate = startOfYear(now);
                break;
            default:
                return baseOrders;
        }

        return baseOrders.filter(order => {
            const orderDate = new Date(order.date);
            return isWithinInterval(orderDate, { start: startDate, end: endOfDay(now) });
        });
    }, [orders, myRestaurantIds, selectedRange]);

    const stats = React.useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.revenuNet, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / totalOrders : 0;

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue
        };
    }, [filteredOrders]);
    
    const revenueByRestaurant = React.useMemo(() => {
        const data = restaurants
          .filter(r => myRestaurantIds.includes(r.id))
          .map(restaurant => {
            const restaurantOrders = filteredOrders.filter(o => o.restaurantId === restaurant.id);
            const revenue = restaurantOrders.reduce((sum, order) => sum + order.revenuNet, 0);
            return {
                name: restaurant.nom.length > 12 ? restaurant.nom.substring(0, 12) + '...' : restaurant.nom,
                revenue
            };
        });
        return data.filter(d => d.revenue > 0);
    }, [filteredOrders, restaurants, myRestaurantIds]);

    const topSellingItems = React.useMemo(() => {
        const itemMap: { [key: string]: { name: string; count: number; revenue: number } } = {};

        filteredOrders.forEach(order => {
            order.plats.forEach(item => {
                if (!itemMap[item.id]) {
                    itemMap[item.id] = { name: item.nom, count: 0, revenue: 0 };
                }
                itemMap[item.id].count += item.quantite;
                const itemPrice = item.prix + (item.accompagnementSelectionne?.prix || 0) + (item.boissonSelectionnee?.prix || 0);
                itemMap[item.id].revenue += itemPrice * item.quantite;
            });
        });

        return Object.values(itemMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredOrders]);
    
    const ranges: { id: TimeRange; label: string }[] = [
        { id: 'today', label: "Aujourd'hui" },
        { id: 'week', label: "Cette Semaine" },
        { id: 'month', label: "Ce Mois" },
        { id: 'year', label: "Cette Année" },
        { id: 'all', label: "Tout" },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden text-white">
            {/* Elite Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]" />
            </div>

            {/* Elite Analytics Header */}
            <div className="relative h-[45vh] w-full overflow-hidden flex items-center justify-center pt-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1551288049-bbbda5366991?q=80&w=2070&auto=format&fit=crop"
                        alt="Data Analytics Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/0 via-[#0A0A0B]/80 to-[#0A0A0B] z-10" />
                </div>
                
                <MobileBackButton />

                <div className="relative z-30 text-center space-y-6 px-6 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm backdrop-blur-md mb-2"
                    >
                        <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Intelligence Stratégique</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-[0.8]"
                    >
                        Analyse <span className="text-orange-500">Elite</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 font-medium max-w-xl mx-auto text-sm md:text-lg leading-relaxed"
                    >
                        Pilotez votre performance avec une clarté absolue et une précision chirurgicale.
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-16 relative z-40 space-y-12">
                {/* Time Range Selector */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-3 rounded-[2rem] shadow-2xl inline-flex mx-auto">
                    {ranges.map((range, idx) => (
                        <motion.button
                            key={range.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                            onClick={() => setSelectedRange(range.id)}
                            className={cn(
                                "relative px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                selectedRange === range.id 
                                    ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" 
                                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {range.label}
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedRange}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-12"
                    >
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'Revenu Net', value: stats.totalRevenue, sub: 'Après commission Yakro Go', icon: DollarSign, color: 'orange' },
                                { label: 'Flux de Commandes', value: stats.totalOrders, sub: 'Activité sur la période', icon: ShoppingCart, color: 'white', unit: 'ITEMS' },
                                { label: 'Valeur de Signature', value: stats.averageOrderValue, sub: 'Panier moyen brut', icon: TrendingUp, color: 'white' }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden transition-all duration-500 hover:border-orange-500/20 hover:shadow-2xl shadow-sm rounded-[2.5rem]"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-orange-500 transition-colors">{item.label}</span>
                                        <div className={`p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-orange-500/20 group-hover:bg-orange-500/10 transition-all`}>
                                            <item.icon className={`h-5 w-5 ${item.color === 'orange' ? 'text-orange-500' : 'text-white/40 group-hover:text-orange-500'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl md:text-6xl font-black italic tracking-tighter ${item.color === 'orange' ? 'text-orange-500' : 'text-white'}`}>
                                            {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                            {item.unit || 'FCFA'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-bold text-white/30 uppercase mt-4 tracking-[0.15em]">{item.sub}</p>
                                    
                                    {/* Decorative element */}
                                    <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Detailed Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-7 bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">Domination Territoriale</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Revenu net par établissement</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <BarChart3 className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                
                                <div className="h-[400px] w-full">
                                    {revenueByRestaurant.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueByRestaurant} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="rgba(255,255,255,0.2)" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={15}
                                                />
                                                <YAxis 
                                                    stroke="rgba(255,255,255,0.2)" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => `${(value as number)/1000}k`} 
                                                />
                                                <Tooltip
                                                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        return (
                                                          <div className="bg-[#121214] border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">{payload[0].payload.name}</p>
                                                            <p className="text-3xl font-black italic tracking-tighter text-white">{(payload[0].value as number).toLocaleString('fr-FR')} <span className="text-[10px] opacity-20 uppercase tracking-widest not-italic ml-1">FCFA</span></p>
                                                          </div>
                                                        )
                                                      }
                                                      return null
                                                    }}
                                                />
                                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={45}>
                                                    {revenueByRestaurant.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={index === 0 ? '#f97316' : 'rgba(255,255,255,0.1)'} 
                                                            className="transition-all duration-500 hover:fill-orange-500"
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-center">
                                            <div className="space-y-4">
                                                <BarChart3 className="h-16 w-16 text-white/10 mx-auto" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Aucune donnée pour cette période</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Sellers Table */}
                            <div className="lg:col-span-5 bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">Palmarès d&apos;Élite</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Top 5 des créations les plus prisées</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        <PieChart className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>

                                {topSellingItems.length > 0 ? (
                                    <div className="space-y-8">
                                        {topSellingItems.map((item, index) => (
                                            <div key={item.name} className="group relative flex items-center justify-between py-2">
                                                <div className="flex items-center gap-5">
                                                    <span className="text-lg font-black italic text-white/10 group-hover:text-orange-500 transition-colors w-6">0{index + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-orange-500 transition-colors">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{item.count} Unités vendues</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black italic tracking-tighter text-orange-500">{item.revenue.toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">F</span></p>
                                                    <div className="h-1 w-24 bg-white/5 mt-3 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.revenue / (topSellingItems[0]?.revenue || 1)) * 100}%` }}
                                                            transition={{ duration: 1.5, ease: "circOut" }}
                                                            className="h-full bg-gradient-to-r from-orange-500/50 to-orange-500" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-center">
                                        <div className="space-y-4">
                                            <PieChart className="h-16 w-16 text-white/10 mx-auto" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Aucune commande sur cette période</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-12 p-8 bg-white/5 border border-white/5 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-3">Conseil de l&apos;Expert</h4>
                                    <p className="text-xs font-bold text-white/60 leading-relaxed italic relative z-10">
                                        &ldquo;Votre plat signature génère {stats.totalRevenue > 0 ? ((topSellingItems[0]?.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}% de votre revenu net. Envisagez de créer une déclinaison <span className="text-white">Premium</span> pour maximiser vos marges.&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Branding */}
                <div className="text-center py-10 opacity-20 group hover:opacity-100 transition-all duration-500">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 group-hover:text-orange-500 transition-colors">
                        Propulsé par Yakro Intelligence Engine v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
