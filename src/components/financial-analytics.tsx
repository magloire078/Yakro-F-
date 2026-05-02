'use client';

import * as React from 'react';
import { Wallet, CreditCard, Activity, BarChart3, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
            <div className="bg-[#121214] border border-white/5 p-4 shadow-2xl rounded-none">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mb-2">{label}</p>
                <p className="text-orange-500 font-black text-xs uppercase">
                    {`${payload[0].value.toLocaleString()} FCFA`}
                </p>
            </div>
        );
    }
    return null;
};

export function FinancialAnalytics() {
    const { orders } = useData();

    const stats = React.useMemo(() => {
        const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
        const totalCommission = orders.reduce((acc, o) => acc + (o.montantCommission || 0), 0);
        const avgOrder = orders.length > 0 ? totalSales / orders.length : 0;
        return { totalSales, totalCommission, avgOrder };
    }, [orders]);

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
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="VOLUME D'AFFAIRES" value={`${stats.totalSales.toLocaleString()} FCFA`} change="+18.5%" isUp={true} icon={<BarChart3 className="text-orange-500" />} />
                <StatCard title="REVENU YAKRO" value={`${stats.totalCommission.toLocaleString()} FCFA`} change="+12.3%" isUp={true} icon={<Wallet className="text-orange-500" />} />
                <StatCard title="PANIER MOYEN" value={`${Math.round(stats.avgOrder).toLocaleString()} FCFA`} change="-2.1%" isUp={false} icon={<CreditCard className="text-orange-500" />} />
                <StatCard title="COMMISSION PLAT." value="15%" change="STABLE" isUp={true} icon={<Activity className="text-orange-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 border-none shadow-3xl bg-[#121214]/80 backdrop-blur-3xl rounded-none border-t border-white/5">
                    <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">Flux de <span className="text-orange-500">Trésorerie</span></CardTitle>
                        <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Analyse neuronale des transactions hebdomadaires</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[450px] p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#4b5563' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#4b5563' }} tickFormatter={(v) => `${v/1000}K`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#F97316" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 border-none shadow-3xl bg-slate-900 rounded-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <CardHeader className="p-8 border-b border-white/5 relative z-10">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-white">Bastions <span className="text-orange-500">Dominants</span></CardTitle>
                        <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Performances d&apos;élite par établissement</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-10 relative z-10">
                        {[
                            { name: 'Allocodrome Express', value: '420K', pct: 85 },
                            { name: 'Le Gourmet de Yakro', value: '310K', pct: 65 },
                            { name: 'Fast-Food Prestige', value: '180K', pct: 40 }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-4 group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase italic tracking-tight text-white group-hover:text-orange-500 transition-colors">{item.name}</span>
                                    <span className="text-[10px] text-orange-500 font-black tracking-widest">{item.value} FCFA</span>
                                </div>
                                <div className="h-1 bg-white/5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.pct}%` }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-10 mt-10 border-t border-white/5 flex items-center gap-4">
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20">
                                <Target className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">RENDEMENT GLOBAL</p>
                                <p className="text-2xl font-black italic text-white">+24.8% <span className="text-[10px] not-italic text-green-500">M/M</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, isUp, icon }: { title: string, value: string, change: string, isUp: boolean, icon: React.ReactNode }) {
    return (
        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="border-none shadow-2xl bg-[#121214]/80 backdrop-blur-2xl rounded-none p-8 relative overflow-hidden group border-t border-white/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-8">
                    <div className="p-3 bg-white/5 border border-white/10 group-hover:border-orange-500/30 transition-colors">
                        {icon}
                    </div>
                    <Badge className={cn(
                        "rounded-none px-3 py-1 border-none text-[9px] font-black tracking-widest",
                        isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                        {isUp ? "▲" : "▼"} {change}
                    </Badge>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">{title}</p>
                    <p className="text-3xl font-black italic tracking-tighter text-white">{value}</p>
                </div>
            </Card>
        </motion.div>
    );
}
