'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { 
    startOfMonth, 
    startOfYear, 
    startOfDay,
    startOfWeek,
    endOfDay,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    isWithinInterval,
    format
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

    const analyticsData = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return { current: [], previous: [] };
        
        const baseOrders = orders.filter(o => myRestaurantIds.includes(o.restaurantId) && o.statut === 'Livrée');
        
        if (selectedRange === 'all') return { current: baseOrders, previous: [] };

        const now = new Date();
        let currentStart: Date;
        let previousStart: Date;
        let previousEnd: Date;

        switch (selectedRange) {
            case 'today':
                currentStart = startOfDay(now);
                previousStart = startOfDay(subDays(now, 1));
                previousEnd = endOfDay(subDays(now, 1));
                break;
            case 'week':
                currentStart = startOfWeek(now, { weekStartsOn: 1 });
                previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
                previousEnd = endOfDay(subDays(currentStart, 1));
                break;
            case 'month':
                currentStart = startOfMonth(now);
                previousStart = startOfMonth(subMonths(now, 1));
                previousEnd = endOfDay(subDays(currentStart, 1));
                break;
            case 'year':
                currentStart = startOfYear(now);
                previousStart = startOfYear(subYears(now, 1));
                previousEnd = endOfDay(subDays(currentStart, 1));
                break;
            default:
                return { current: baseOrders, previous: [] };
        }

        const current = baseOrders.filter(order => {
            const date = new Date(order.date);
            return isWithinInterval(date, { start: currentStart, end: now });
        });

        const previous = baseOrders.filter(order => {
            const date = new Date(order.date);
            return isWithinInterval(date, { start: previousStart, end: previousEnd });
        });

        return { current, previous };
    }, [orders, myRestaurantIds, selectedRange]);

    const stats = React.useMemo(() => {
        const calculateStats = (orderList: typeof orders) => {
            const revenue = orderList.reduce((sum, order) => sum + order.revenuNet, 0);
            const count = orderList.length;
            const avg = count > 0 ? orderList.reduce((sum, order) => sum + order.total, 0) / count : 0;
            return { revenue, count, avg };
        };

        const current = calculateStats(analyticsData.current);
        const previous = calculateStats(analyticsData.previous);

        const calculateGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        return {
            totalRevenue: current.revenue,
            totalOrders: current.count,
            averageOrderValue: current.avg,
            revenueGrowth: calculateGrowth(current.revenue, previous.revenue),
            ordersGrowth: calculateGrowth(current.count, previous.count),
            avgGrowth: calculateGrowth(current.avg, previous.avg)
        };
    }, [analyticsData]);
    
    const revenueByRestaurant = React.useMemo(() => {
        const data = restaurants
          .filter(r => myRestaurantIds.includes(r.id))
          .map(restaurant => {
            const restaurantOrders = analyticsData.current.filter(o => o.restaurantId === restaurant.id);
            const revenue = restaurantOrders.reduce((sum, order) => sum + order.revenuNet, 0);
            return {
                name: restaurant.nom.length > 12 ? restaurant.nom.substring(0, 12) + '...' : restaurant.nom,
                revenue
            };
        });
        return data.filter(d => d.revenue > 0).sort((a, b) => b.revenue - a.revenue);
    }, [analyticsData, restaurants, myRestaurantIds]);

    const topSellingItems = React.useMemo(() => {
        const itemMap: { [key: string]: { name: string; count: number; revenue: number } } = {};

        analyticsData.current.forEach(order => {
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
    }, [analyticsData]);
    
    const revenueTrend = React.useMemo(() => {
        const now = new Date();
        let days: number;

        switch (selectedRange) {
            case 'today': days = 1; break;
            case 'week': days = 7; break;
            case 'month': days = 30; break;
            case 'year': days = 12; break;
            case 'all': days = 6; break; // Show last 6 months for "All"
            default: return [];
        }

        const data = [];
        for (let i = 0; i < days; i++) {
            let d: Date;
            let label: string;

            if (selectedRange === 'year' || selectedRange === 'all') {
                d = startOfMonth(subMonths(now, (days - 1) - i));
                label = format(d, 'MMM');
            } else {
                d = subDays(now, (days - 1) - i);
                label = format(d, 'dd/MM');
            }

            const currentStart = startOfDay(d);
            const currentEnd = endOfDay(d);
            
            let prevD: Date;
            if (selectedRange === 'week') prevD = subWeeks(d, 1);
            else if (selectedRange === 'month') prevD = subMonths(d, 1);
            else if (selectedRange === 'year' || selectedRange === 'all') prevD = subYears(d, 1);
            else prevD = subDays(d, 1);

            const prevStart = startOfDay(prevD);
            const prevEnd = endOfDay(prevD);

            const currentRevenue = analyticsData.current
                .filter(o => isWithinInterval(new Date(o.date), { start: currentStart, end: currentEnd }))
                .reduce((sum, o) => sum + o.revenuNet, 0);

            const previousRevenue = analyticsData.previous
                .filter(o => isWithinInterval(new Date(o.date), { start: prevStart, end: prevEnd }))
                .reduce((sum, o) => sum + o.revenuNet, 0);

            data.push({
                name: label,
                current: currentRevenue,
                previous: previousRevenue
            });
        }

        return data;
    }, [selectedRange, analyticsData]);
    
    const ranges: { id: TimeRange; label: string }[] = [
        { id: 'today', label: "Aujourd'hui" },
        { id: 'week', label: "Cette Semaine" },
        { id: 'month', label: "Ce Mois" },
        { id: 'year', label: "Cette Année" },
        { id: 'all', label: "Tout" },
    ];

    return (
        <div className="min-h-screen bg-transparent pb-24 relative overflow-hidden">

            {/* Elite Analytics Header */}
            <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1551288049-bbbda5366991?q=80&w=2070&auto=format&fit=crop"
                        alt="Data Analytics Background"
                        fill
                        className="object-cover opacity-5 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/20" />
                </div>
                
                {/* Mobile Back Button — pattern my-restaurants */}
                <MobileBackButton 
                    label="Dashboard" 
                    href="/restaurateur" 
                    className="md:hidden absolute top-6 left-4 z-50 mb-0"
                />

                <div className="relative z-30 text-center space-y-4 px-6 max-w-4xl pt-10 md:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-4"
                    >
                        <Activity className="h-3 w-3 text-orange-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Intelligence Stratégique</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-none"
                    >
                        Analyse <span className="text-orange-500">Elite</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-medium text-[10px] md:text-xs uppercase tracking-[0.3em]"
                    >
                        Pilotez votre performance avec précision chirurgicale
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl -mt-12 md:-mt-16 relative z-40 space-y-10 md:space-y-12">
                {/* Time Range Selector — sticky scrollable on mobile */}
                <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 py-4 mb-4 flex overflow-x-auto gap-3 no-scrollbar scroll-smooth snap-x bg-[#0A0A0B]/80 backdrop-blur-xl md:relative md:top-auto md:mx-0 md:px-0 md:py-0 md:justify-center md:flex-wrap md:bg-transparent">
                    {ranges.map((range, idx) => (
                        <motion.button
                            key={range.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                            onClick={() => setSelectedRange(range.id)}
                            className={cn(
                                "flex-none snap-start px-5 py-3 md:px-6 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                                selectedRange === range.id 
                                    ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" 
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                            {[
                                { label: 'Revenu Net', value: stats.totalRevenue, growth: stats.revenueGrowth, sub: 'Après commission Yakro Go', icon: DollarSign, color: 'orange' },
                                { label: 'Flux de Commandes', value: stats.totalOrders, growth: stats.ordersGrowth, sub: 'Activité sur la période', icon: ShoppingCart, color: 'slate', unit: 'ITEMS' },
                                { label: 'Valeur de Signature', value: stats.averageOrderValue, growth: stats.avgGrowth, sub: 'Panier moyen brut', icon: TrendingUp, color: 'slate' }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group glass-dark p-8 relative overflow-hidden transition-all duration-500 hover:border-orange-500/50 hover:shadow-orange-500/10 shadow-xl rounded-[2.5rem]"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-orange-500 transition-colors">{item.label}</span>
                                            {selectedRange !== 'all' && (
                                                <div className={cn(
                                                    "flex items-center gap-1 text-[10px] font-bold",
                                                    item.growth >= 0 ? "text-emerald-500" : "text-rose-500"
                                                )}>
                                                    {item.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3 rotate-180" />}
                                                    <span>{Math.abs(item.growth).toFixed(1)}%</span>
                                                    <span className="text-slate-400 ml-1">vs période précédente</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 group-hover:border-orange-500/20 group-hover:bg-orange-500/10 transition-all">
                                            <item.icon className={`h-5 w-5 ${item.color === 'orange' ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl md:text-6xl font-black italic tracking-tighter ${item.color === 'orange' ? 'text-orange-500' : 'text-white'}`}>
                                            {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                            {item.unit || 'FCFA'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-[0.15em]">{item.sub}</p>
                                    <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Detailed Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Revenue Trend Chart - Full Width */}
                            <div className="lg:col-span-12 glass-dark p-8 relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">Évolution de l&apos;Empire</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Revenu net actuel vs période précédente</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Actuel</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Précédent</span>
                                        </div>
                                        <div className="p-3 bg-slate-100 rounded-2xl">
                                            <Activity className="h-6 w-6 text-orange-500" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                                                </linearGradient>
                                                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0.2}/>
                                                </linearGradient>
                                            </defs>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#475569" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={15}
                                                />
                                                <YAxis 
                                                    stroke="#475569" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => `${(value as number)/1000}k`} 
                                                />
                                                <Tooltip
                                                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        const curr = payload.find(p => p.dataKey === 'current')?.value as number || 0;
                                                        const prev = payload.find(p => p.dataKey === 'previous')?.value as number || 0;
                                                        const growth = prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

                                                        return (
                                                          <div className="bg-[#0A0A0B] border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">{payload[0].payload.name}</p>
                                                            <div className="space-y-1">
                                                                <p className="text-2xl font-black italic tracking-tighter text-white">{curr.toLocaleString('fr-FR')} <span className="text-[10px] opacity-20 uppercase tracking-widest not-italic ml-1">FCFA</span></p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Précédent: {prev.toLocaleString('fr-FR')} F</p>
                                                            </div>
                                                            {prev > 0 && (
                                                                <div className={cn(
                                                                    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                                                                    growth >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                                )}>
                                                                    {growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
                                                                </div>
                                                            )}
                                                          </div>
                                                        )
                                                      }
                                                      return null
                                                    }}
                                                />
                                            <Bar dataKey="previous" fill="url(#colorPrevious)" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="current" fill="url(#colorCurrent)" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Revenue by Restaurant */}
                            <div className="lg:col-span-7 glass-dark p-8 relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">Répartition Elite</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Revenu net par établissement</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 rounded-2xl">
                                        <BarChart3 className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                
                                <div className="h-[350px] w-full">
                                    {revenueByRestaurant.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueByRestaurant} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.3}/>
                                                </linearGradient>
                                                <linearGradient id="colorEmpty" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0.3}/>
                                                </linearGradient>
                                            </defs>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#475569" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={15}
                                                />
                                                <YAxis 
                                                    stroke="#475569" 
                                                    fontSize={10}
                                                    fontWeight="900"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value) => `${(value as number)/1000}k`} 
                                                />
                                                <Tooltip
                                                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                    content={({ active, payload }) => {
                                                      if (active && payload && payload.length) {
                                                        return (
                                                          <div className="bg-[#0A0A0B] border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 block">{payload[0].payload.name}</p>
                                                            <p className="text-3xl font-black italic tracking-tighter text-white">{(payload[0].value as number).toLocaleString('fr-FR')} <span className="text-[10px] opacity-20 uppercase tracking-widest not-italic ml-1">FCFA</span></p>
                                                          </div>
                                                        )
                                                      }
                                                      return null
                                                    }}
                                                />
                                                <Bar dataKey="revenue" radius={[12, 12, 0, 0]} barSize={50} animationDuration={1500}>
                                                    {revenueByRestaurant.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={index === 0 ? 'url(#colorRevenue)' : 'url(#colorEmpty)'} 
                                                            className="transition-all duration-500 cursor-pointer hover:opacity-80"
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-center">
                                            <div className="space-y-4">
                                                <BarChart3 className="h-16 w-16 text-slate-200 mx-auto" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aucune donnée pour cette période</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Sellers Table */}
                            <div className="lg:col-span-5 glass-dark p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">Palmarès de Signature</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Les 5 créations les plus dominantes</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 rounded-2xl">
                                        <PieChart className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    {topSellingItems.length > 0 ? (
                                        topSellingItems.map((item, index) => (
                                            <div key={item.name} className="group relative flex items-center justify-between py-2">
                                                <div className="flex items-center gap-5">
                                                    <span className="text-lg font-black italic text-slate-200 group-hover:text-orange-500 transition-colors w-6">0{index + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tight text-white group-hover:text-orange-500 transition-colors">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.count} Unités vendues</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black italic tracking-tighter text-orange-500">{item.revenue.toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">F</span></p>
                                                    <div className="h-1 w-24 bg-slate-100 mt-3 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.revenue / (topSellingItems[0]?.revenue || 1)) * 100}%` }}
                                                            transition={{ duration: 1.5, ease: "circOut" }}
                                                            className="h-full bg-gradient-to-r from-orange-500/50 to-orange-500" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-center">
                                            <div className="space-y-4">
                                                <PieChart className="h-16 w-16 text-slate-200 mx-auto" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">En attente de commandes...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-12 p-8 bg-white/5 border border-white/5 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-3">Vision Stratégique</h4>
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic relative z-10">
                                        &ldquo;Votre plat signature génère {stats.totalRevenue > 0 ? ((topSellingItems[0]?.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}% de votre revenu net. Une optimisation de marge sur ce produit impacterait drastiquement votre rentabilité globale.&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Branding */}
                <div className="text-center py-10 opacity-20 group hover:opacity-100 transition-all duration-500">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 group-hover:text-orange-500 transition-colors">
                        Propulsé par Yakro Intelligence Engine v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
