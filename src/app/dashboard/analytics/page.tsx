'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, PieChart, Activity, Calendar } from 'lucide-react';
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
        
        let baseOrders = orders.filter(o => myRestaurantIds.includes(o.restaurantId) && o.statut === 'Livrée');
        
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
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden">
            {/* Immersive Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[1000px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent opacity-50" />
            <div className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] bg-orange-500/5 rounded-full blur-[200px]" />

            {/* Elite Analytics Header */}
            <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1551288049-bbbda5366991?q=80&w=2070&auto=format&fit=crop"
                        alt="Data Analytics Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-black/80 z-10" />
                </div>
                <div className="relative z-30 text-center space-y-6 px-6 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-2"
                    >
                        <Activity className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Intelligence Financière</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-8xl font-black uppercase tracking-tighter text-white italic leading-none"
                    >
                        Vision <span className="text-orange-500">Stratégique</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 font-medium max-w-xl mx-auto text-xs md:text-lg"
                    >
                        Analysez vos performances avec une précision chirurgicale et optimisez la rentabilité de votre empire culinaire.
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-12 md:-mt-16 relative z-40 space-y-6 md:space-y-10">
                <MobileBackButton />

                {/* Time Range Selector */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
                    {ranges.map((range, idx) => (
                        <motion.button
                            key={range.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                            onClick={() => setSelectedRange(range.id)}
                            className={cn(
                                "relative px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border rounded-none",
                                selectedRange === range.id 
                                    ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                                    : "bg-[#121214]/60 backdrop-blur-md border-white/5 text-gray-500 hover:border-white/20 hover:text-white"
                            )}
                        >
                            {range.label}
                            {selectedRange === range.id && (
                                <motion.div 
                                    layoutId="activeRange"
                                    className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-white"
                                />
                            )}
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
                                    
                                    {/* Decorative element */}
                                    <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Detailed Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 md:mt-10">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-7 bg-[#121214]/60 backdrop-blur-md border border-white/5 p-8 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Domination Territoriale</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Revenu net par établissement</p>
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-gray-700" />
                                </div>
                                
                                <div className="h-[400px] w-full">
                                    {revenueByRestaurant.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueByRestaurant} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#333" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={15}
                                                />
                                                <YAxis 
                                                    stroke="#333" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => `${(value as number)/1000}k`} 
                                                />
                                                <Tooltip
                                                    cursor={{fill: 'rgba(249,115,22,0.05)'}}
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        return (
                                                          <div className="bg-[#0A0A0B] border border-white/10 p-4 shadow-2xl">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">{payload[0].payload.name}</p>
                                                            <p className="text-2xl font-black tracking-tighter text-white">{(payload[0].value as number).toLocaleString('fr-FR')} <span className="text-[8px] opacity-40 uppercase tracking-widest ml-1">FCFA</span></p>
                                                          </div>
                                                        )
                                                      }
                                                      return null
                                                    }}
                                                />
                                                <Bar dataKey="revenue" radius={[2, 2, 0, 0]} barSize={40}>
                                                    {revenueByRestaurant.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={index === 0 ? '#f97316' : '#222'} 
                                                            className="transition-all duration-500 hover:fill-orange-500"
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-center">
                                            <div className="space-y-4">
                                                <BarChart3 className="h-12 w-12 text-gray-800 mx-auto opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Aucune donnée pour cette période</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Sellers Table */}
                            <div className="lg:col-span-5 bg-[#121214]/60 backdrop-blur-md border border-white/5 p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Palmarès d&apos;Élite</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Top 5 des créations les plus prisées</p>
                                    </div>
                                    <PieChart className="h-5 w-5 text-gray-700" />
                                </div>

                                {topSellingItems.length > 0 ? (
                                    <div className="space-y-6">
                                        {topSellingItems.map((item, index) => (
                                            <div key={item.name} className="group relative flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black italic text-gray-700 group-hover:text-orange-500 transition-colors w-4">0{index + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{item.count} Unités vendues</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black italic tracking-tighter text-orange-500">{item.revenue.toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">F</span></p>
                                                    <div className="h-1 w-20 bg-white/5 mt-2 overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.revenue / (topSellingItems[0]?.revenue || 1)) * 100}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className="h-full bg-orange-500" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-center">
                                        <div className="space-y-4">
                                            <PieChart className="h-12 w-12 text-gray-800 mx-auto opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Aucune commande sur cette période</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-12 p-6 bg-orange-500/5 border border-orange-500/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Conseil de l&apos;Expert</h4>
                                    <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic">
                                        &ldquo;Votre plat signature génère {stats.totalRevenue > 0 ? ((topSellingItems[0]?.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}% de votre revenu net. Envisagez de créer une déclinaison Premium pour maximiser vos marges.&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Branding */}
                <div className="text-center py-10 opacity-20 group hover:opacity-40 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                        Propulsé par Yakro Intelligence Engine v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
