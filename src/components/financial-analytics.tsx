'use client';

import * as React from 'react';
import { Wallet, CreditCard, Activity, BarChart3, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, subDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: Record<string, unknown> }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A0A0B]/90 backdrop-blur-3xl border border-white/10 p-5 shadow-3xl rounded-[1.5rem]">
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] mb-3">{label}</p>
                <p className="text-primary font-black text-lg italic tracking-tighter">
                    {`${payload[0].value.toLocaleString()} FCFA`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Flux Capturé</span>
                </div>
            </div>
        );
    }
    return null;
};

export function FinancialAnalytics() {
    const { orders, restaurants } = useData();

    const stats = React.useMemo(() => {
        const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
        const totalCommission = orders.reduce((acc, o) => acc + (o.montantCommission || 0), 0);
        const avgOrder = orders.length > 0 ? totalSales / orders.length : 0;
        return { totalSales, totalCommission, avgOrder };
    }, [orders]);

    // Classement réel par revenu net (commission déduite), pas de données
    // inventées — seuls les établissements avec au moins une commande
    // apparaissent.
    const topRestaurants = React.useMemo(() => {
        const revenueByRestaurant = new Map<string, number>();
        for (const order of orders) {
            revenueByRestaurant.set(
                order.restaurantId,
                (revenueByRestaurant.get(order.restaurantId) || 0) + (order.revenuNet || 0)
            );
        }
        const ranked = Array.from(revenueByRestaurant.entries())
            .map(([restaurantId, revenue]) => ({
                name: restaurants.find(r => r.id === restaurantId)?.nom || 'Restaurant inconnu',
                revenue,
            }))
            .filter(r => r.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3);
        const max = ranked[0]?.revenue || 1;
        return ranked.map(r => ({ ...r, pct: Math.round((r.revenue / max) * 100) }));
    }, [orders, restaurants]);

    const chartData = React.useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            const dayOrders = orders.filter(o => isSameDay(new Date(o.date), date));
            
            return {
                name: format(date, 'EEE', { locale: fr }).toUpperCase(),
                revenue: dayOrders.reduce((acc, o) => acc + (o.montantCommission || 0), 0),
                sales: dayOrders.reduce((acc, o) => acc + (o.total || 0), 0)
            };
        });
    }, [orders]);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Volume d'Affaires"
                    value={`${stats.totalSales.toLocaleString()}`}
                    unit="FCFA"
                    icon={<BarChart3 className="text-primary" />}
                    delay={0}
                />
                <StatCard
                    title="Revenu Yakro"
                    value={`${stats.totalCommission.toLocaleString()}`}
                    unit="FCFA"
                    icon={<Wallet className="text-primary" />}
                    delay={0.1}
                />
                <StatCard
                    title="Panier Moyen"
                    value={`${Math.round(stats.avgOrder).toLocaleString()}`}
                    unit="FCFA"
                    icon={<CreditCard className="text-primary" />}
                    delay={0.2}
                />
                <StatCard
                    title="Commission Plat."
                    value="15"
                    unit="%"
                    change="STABLE"
                    isUp={true}
                    icon={<Activity className="text-primary" />}
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Chart */}
                <Card className="lg:col-span-2 border border-white/5 shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="p-10 border-b border-white/5 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">Flux de <span className="text-primary">Trésorerie</span></CardTitle>
                        <CardDescription className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Analyse neuronale des transactions hebdomadaires</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[450px] p-10 pt-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: '900', fill: '#4b5563', letterSpacing: '0.1em' }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: '900', fill: '#4b5563' }} 
                                    tickFormatter={(v) => `${v/1000}K`} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#F97316" 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    strokeWidth={4} 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Performance Sidebar */}
                <Card className="lg:col-span-1 border border-white/5 shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-primary/10" />
                    <CardHeader className="p-10 border-b border-white/5 relative z-10">
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">Bastions <span className="text-primary">Dominants</span></CardTitle>
                        <CardDescription className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Revenu net par établissement, toutes commandes confondues</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-12 relative z-10">
                        {topRestaurants.length > 0 ? topRestaurants.map((item, idx) => (
                            <div key={item.name} className="space-y-4 group/item">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-black uppercase italic tracking-tight text-white group-hover/item:text-primary transition-colors">{item.name}</span>
                                    <span className="text-[10px] text-primary font-black tracking-widest">{item.revenue.toLocaleString()} FCFA</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.pct}%` }}
                                        transition={{ duration: 1.5, delay: 0.5 + (idx * 0.2), ease: "circOut" }}
                                        className="h-full bg-primary shadow-[0_0_15px_rgba(249,115,22,0.6)] rounded-full"
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-[11px] text-slate-500 uppercase tracking-widest text-center py-4">Pas encore de commande</p>
                        )}

                        <div className="pt-10 mt-10 border-t border-white/5 flex items-center gap-6">
                            <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl group-hover:scale-110 transition-transform">
                                <Target className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Commandes totales</p>
                                <p className="text-3xl font-black italic text-white leading-none">{orders.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, unit, change, isUp, icon, delay }: { title: string, value: string, unit: string, change?: string, isUp?: boolean, icon: React.ReactNode, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -5 }}
        >
            <Card className="border border-white/5 shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 relative overflow-hidden group transition-all duration-500 hover:border-primary/30">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                <div className="flex items-start justify-between mb-10">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-primary/10 group-hover:border-primary/30 transition-all group-hover:scale-110">
                        {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6 text-primary' })}
                    </div>
                    {change && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest",
                            isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {change}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black italic tracking-tighter text-white">{value}</p>
                        <span className="text-xs font-black text-primary uppercase tracking-widest">{unit}</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
