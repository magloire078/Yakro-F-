'use client';

import * as React from 'react';
import { 
    FileText, 
    FileSpreadsheet, 
    Calendar, 
    ChevronRight, 
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        
        // Calculer les top restaurants
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

        // Calculer les données quotidiennes pour le graphique
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                    .print-grid {
                        display: grid !important;
                        grid-template-cols: 1fr 1fr !important;
                        gap: 20px !important;
                    }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border-bottom: 1px solid #eee !important; padding: 10px 5px !important; }
                }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Selector Card */}
                <Card className="lg:col-span-1 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-500" />
                            Période
                        </CardTitle>
                        <CardDescription>Sélectionnez le mois à exporter.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {months.map((month) => (
                            <button
                                key={month.toISOString()}
                                onClick={() => setSelectedMonth(month)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                    format(selectedMonth, 'MM-yyyy') === format(month, 'MM-yyyy')
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <span className="font-bold capitalize">{format(month, 'MMMM yyyy', { locale: fr })}</span>
                                <ChevronRight className={cn(
                                    "h-4 w-4 transition-transform",
                                    format(selectedMonth, 'MM-yyyy') === format(month, 'MM-yyyy') ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                                )} />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Report Summary */}
                <Card className="lg:col-span-2 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <BarChart className="h-40 w-40 text-orange-500" />
                    </div>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black print:hidden">Rapport Mensuel</CardTitle>
                                <CardDescription className="capitalize print:hidden">{format(selectedMonth, 'MMMM yyyy', { locale: fr })}</CardDescription>
                                
                                <div className="hidden print:block mb-8">
                                    <div className="flex justify-between items-center border-b-2 border-orange-500 pb-6 mb-8">
                                        <div>
                                            <h1 className="text-3xl font-black italic uppercase tracking-tighter">YAKRO <span className="text-orange-500">GO</span> CORPORATE</h1>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rapport de Performance Administrative</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black uppercase italic">{format(selectedMonth, 'MMMM yyyy', { locale: fr })}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Généré le: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 print:hidden">
                                <Button onClick={exportToCSV} variant="outline" className="rounded-xl gap-2 font-bold border-slate-200">
                                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                    Excel
                                </Button>
                                <Button onClick={handlePrint} className="rounded-xl gap-2 font-bold bg-slate-900 text-white hover:bg-slate-800">
                                    <FileText className="h-4 w-4 text-blue-400" />
                                    PDF / Imprimer
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Volume de Ventes</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{reportStats.totalSales.toLocaleString()} FCFA</p>
                            </div>
                            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Commissions Yakro Go</p>
                                <p className="text-3xl font-black text-orange-500">{reportStats.totalCommission.toLocaleString()} FCFA</p>
                            </div>
                        </div>

                        {/* Visual Analytics Chart */}
                        <div className="mb-10 h-[250px] w-full print:hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportStats.dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: '900', fill: '#64748b' }} 
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[#121214] border border-white/5 p-3 shadow-2xl rounded-none">
                                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                                                        <p className="text-orange-500 font-black text-xs uppercase">{(payload[0].value || 0).toLocaleString()} FCFA</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">{payload[0].payload.count} commandes</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {reportStats.dailyData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.total > 0 ? '#F97316' : '#1e293b'} 
                                                fillOpacity={entry.total > 0 ? 0.8 : 0.2}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 space-y-8">
                            <div className="print-break-inside-avoid">
                                <h4 className="font-black italic uppercase tracking-tighter text-sm mb-6 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    Top Bastions (Performance)
                                </h4>
                                <div className="overflow-hidden border border-slate-100 dark:border-white/5">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 dark:bg-white/5">
                                            <tr className="text-left">
                                                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px]">Restaurant</th>
                                                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-right">Volume</th>
                                                <th className="py-3 px-4 font-black uppercase tracking-widest text-[10px] text-right">Commandes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportStats.topRestaurants.map((r, idx) => (
                                                <tr key={idx} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                                                    <td className="py-3 px-4 font-bold uppercase">{r.name}</td>
                                                    <td className="py-3 px-4 text-right font-black">{r.total.toLocaleString()} FCFA</td>
                                                    <td className="py-3 px-4 text-right text-slate-500">{r.count} unités</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="hidden print:block print-break-inside-avoid">
                                <h4 className="font-black italic uppercase tracking-tighter text-sm mb-6">Registre des Transactions</h4>
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900 text-left">
                                            <th className="py-2">ID TRANS.</th>
                                            <th className="py-2">UNITÉ</th>
                                            <th className="py-2">MONTANT</th>
                                            <th className="py-2">COMMISSION</th>
                                            <th className="py-2">STATUT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(o => (
                                            <tr key={o.id} className="border-b border-slate-100">
                                                <td className="py-2 font-mono">#{o.id.substring(0, 8)}</td>
                                                <td className="py-2 font-bold uppercase">{o.nomRestaurant}</td>
                                                <td className="py-2">{o.total.toLocaleString()} FCFA</td>
                                                <td className="py-2 text-orange-600 font-bold">{o.montantCommission.toLocaleString()} FCFA</td>
                                                <td className="py-2 uppercase font-black text-[8px]">{o.statut}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-10 pt-10 border-t border-slate-200 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">DOCUMENT OFFICIEL YAKRO GO &bull; ARCHIVE ADMINISTRATIVE</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
