'use client';

import * as React from 'react';
import {
    FileSpreadsheet,
    Calendar,
    ChevronRight,
    TrendingUp,
    Download,
    Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ReportCenter() {
    const { orders } = useData();
    const [selectedMonth, setSelectedMonth] = React.useState(new Date());

    const months = React.useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i));
    }, []);

    const filteredOrders = React.useMemo(() => {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        return orders.filter(o => {
            const date = new Date(o.date);
            return isWithinInterval(date, { start, end });
        });
    }, [orders, selectedMonth]);

    const reportStats = React.useMemo(() => {
        const totalSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const totalCommission = filteredOrders.reduce((acc, o) => acc + (o.montantCommission || 0), 0);
        
        const restaurantPerformance: Record<string, { total: number, count: number }> = {};
        filteredOrders.forEach(o => {
            if (!restaurantPerformance[o.nomRestaurant]) {
                restaurantPerformance[o.nomRestaurant] = { total: 0, count: 0 };
            }
            restaurantPerformance[o.nomRestaurant].total += o.total;
            restaurantPerformance[o.nomRestaurant].count += 1;
        });

        const topRestaurants = Object.entries(restaurantPerformance)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(selectedMonth),
            end: endOfMonth(selectedMonth)
        });

        const dailyData = daysInMonth.map(day => {
            const dayOrders = filteredOrders.filter(o => isSameDay(new Date(o.date), day));
            return {
                day: format(day, 'dd'),
                fullDate: format(day, 'dd MMMM yyyy', { locale: fr }),
                total: dayOrders.reduce((acc, o) => acc + (o.total || 0), 0),
                count: dayOrders.length
            };
        });

        return { totalSales, totalCommission, count: filteredOrders.length, topRestaurants, dailyData };
    }, [filteredOrders, selectedMonth]);

    const exportToCSV = () => {
        const headers = ['ID', 'Date', 'Restaurant', 'Total', 'Commission', 'Statut'];
        const rows = filteredOrders.map(o => [
            o.id,
            format(new Date(o.date), 'dd/MM/yyyy HH:mm'),
            o.nomRestaurant,
            o.total,
            o.montantCommission,
            o.statut
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rapport_yakro_go_${format(selectedMonth, 'MM_yyyy')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; background: white !important; color: black !important; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 40px;
                        background: white !important;
                    }
                    .no-print { display: none !important; }
                    .print-break-inside-avoid { break-inside: avoid; }
                    .print-header {
                        border-bottom: 2px solid #F97316;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        display: flex !important;
                        justify-content: space-between;
                        align-items: center;
                    }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border-bottom: 1px solid #eee !important; padding: 10px 5px !important; }
                }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Selector Section */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar className="h-12 w-12 text-orange-500" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 italic">PÉRIODE D&apos;ANALYSE</h3>
                        
                        <div className="space-y-3 relative z-10">
                            {months.map((month) => {
                                const isSelected = format(selectedMonth, 'MM-yyyy') === format(month, 'MM-yyyy');
                                return (
                                    <button
                                        key={month.toISOString()}
                                        onClick={() => setSelectedMonth(month)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-500 group/btn border border-transparent relative overflow-hidden",
                                            isSelected
                                                ? "bg-orange-500 text-white shadow-[0_10px_20px_rgba(249,115,22,0.3)] scale-[1.02]"
                                                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/5 hover:text-white"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-40 shadow-[0_0_10px_#fff]" />
                                        )}
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-black uppercase italic tracking-tighter text-xs">{format(month, 'MMMM yyyy', { locale: fr })}</span>
                                            <span className={cn(
                                                "text-[8px] font-bold uppercase tracking-widest",
                                                isSelected ? "text-orange-100" : "text-slate-600"
                                            )}>Période Archive</span>
                                        </div>
                                        <ChevronRight className={cn(
                                            "h-4 w-4 transition-all duration-500",
                                            isSelected ? "translate-x-1" : "opacity-0 group-hover/btn:opacity-100"
                                        )} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-orange-500 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(249,115,22,0.2)] group overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 p-8 opacity-10 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110">
                            <Download className="h-24 w-24 text-white" />
                        </div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6 relative z-10">Exportation</h3>
                        <div className="space-y-3 relative z-10">
                            <Button onClick={exportToCSV} variant="secondary" className="w-full h-12 bg-white text-orange-500 hover:bg-orange-50 rounded-xl font-black italic uppercase tracking-tighter transition-all hover:scale-105 shadow-xl">
                                <FileSpreadsheet className="mr-3 h-4 w-4" />
                                Données CSV
                            </Button>
                            <Button onClick={handlePrint} className="w-full h-12 bg-slate-900/40 text-white hover:bg-slate-900/60 rounded-xl font-black italic uppercase tracking-tighter border border-white/10 transition-all hover:scale-105">
                                <Printer className="mr-3 h-4 w-4" />
                                Format PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="lg:col-span-3 space-y-10">
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Document Certifié</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                                    Rapport <span className="text-orange-500 italic">Administratif</span>
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
                                    Synthèse des performances • {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                                </p>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="text-right hidden md:block">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">GÉNÉRÉ LE</p>
                                    <p className="text-sm font-black italic text-slate-400">{format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
                            <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] group/stat hover:border-orange-500/30 transition-all duration-500">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 group-hover/stat:text-orange-500 transition-colors">VOLUME TRANSACTIONNEL</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black italic tracking-tighter text-white">{reportStats.totalSales.toLocaleString()}</p>
                                    <span className="text-xs font-black text-orange-500 tracking-widest">FCFA</span>
                                </div>
                            </div>
                            <div className="p-8 bg-orange-500/5 border border-orange-500/10 rounded-[2rem] group/stat hover:border-orange-500/40 transition-all duration-500">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/60 mb-2 group-hover/stat:text-orange-500 transition-colors">COMMISSIONS COLLECTÉES</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black italic tracking-tighter text-orange-500">{reportStats.totalCommission.toLocaleString()}</p>
                                    <span className="text-xs font-black text-white tracking-widest">FCFA</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart Visualization */}
                        <div className="mb-16 h-[350px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportStats.dailyData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#F97316" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: '900', fill: '#4b5563', letterSpacing: '0.1em' }} 
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[#0A0A0B]/90 backdrop-blur-3xl border border-white/10 p-5 shadow-3xl rounded-[1.5rem]">
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">{payload[0].payload.fullDate}</p>
                                                        <p className="text-orange-500 font-black text-lg italic tracking-tighter">{(payload[0].value || 0).toLocaleString()} FCFA</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{payload[0].payload.count} OPÉRATIONS</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                        {reportStats.dailyData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.total > 0 ? "url(#barGradient)" : '#ffffff'} 
                                                fillOpacity={entry.total > 0 ? 1 : 0.05}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Performers Table */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Bastions à Haut Rendement</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/5">
                                        <tr className="text-left">
                                            <th className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ÉTABLISSEMENT</th>
                                            <th className="py-6 px-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">VOLUME D&apos;AFFAIRES</th>
                                            <th className="py-6 px-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">TRANSACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {reportStats.topRestaurants.map((r, idx) => (
                                            <tr key={idx} className="group/row hover:bg-white/5 transition-colors">
                                                <td className="py-6 px-4">
                                                    <span className="font-black text-sm text-white uppercase italic tracking-tight group-hover/row:text-orange-500 transition-colors">
                                                        {r.name}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <span className="text-sm font-black text-white">{r.total.toLocaleString()}</span>
                                                    <span className="ml-2 text-[9px] font-bold text-orange-500 uppercase">FCFA</span>
                                                </td>
                                                <td className="py-6 px-4 text-right">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{r.count} unités</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer decorative text */}
                        <div className="mt-20 pt-10 border-t border-white/5 text-center opacity-20">
                            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">
                                YAKRO GO SUPREME AUTHORITY &bull; PROTOCOLE DE RAPPORT V9.4
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Hidden Section for Printing */}
            <div className="hidden print:block print-section">
                <div className="print-header">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">YAKRO <span className="text-orange-500">GO</span> CORPORATE</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rapport de Performance Administrative</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black uppercase italic">{format(selectedMonth, 'MMMM yyyy', { locale: fr })}</p>
                        <p className="text-[10px] font-bold text-slate-400">Généré le: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-6 border-2 border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Volume de Ventes</p>
                        <p className="text-3xl font-black">{reportStats.totalSales.toLocaleString()} FCFA</p>
                    </div>
                    <div className="p-6 border-2 border-orange-100 bg-orange-50/20 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-orange-400 mb-1">Commissions</p>
                        <p className="text-3xl font-black text-orange-500">{reportStats.totalCommission.toLocaleString()} FCFA</p>
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="font-black italic uppercase text-sm border-b-2 border-slate-900 pb-2 mb-6">Registre des Transactions</h3>
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="text-left border-b border-slate-200">
                                <th className="py-2">ID TRANS.</th>
                                <th className="py-2">UNITÉ</th>
                                <th className="py-2 text-right">MONTANT</th>
                                <th className="py-2 text-right">COMMISSION</th>
                                <th className="py-2">STATUT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => (
                                <tr key={o.id} className="border-b border-slate-50">
                                    <td className="py-2 font-mono">#{o.id.substring(0, 8)}</td>
                                    <td className="py-2 font-bold uppercase">{o.nomRestaurant}</td>
                                    <td className="py-2 text-right">{o.total.toLocaleString()} FCFA</td>
                                    <td className="py-2 text-right text-orange-600 font-bold">{o.montantCommission.toLocaleString()} FCFA</td>
                                    <td className="py-2 uppercase font-black text-[8px]">{o.statut}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-20 pt-10 border-t-2 border-slate-100 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">DOCUMENT OFFICIEL YAKRO GO &bull; ARCHIVE ADMINISTRATIVE</p>
                </div>
            </div>
        </div>
    );
}

