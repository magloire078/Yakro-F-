'use client';

import * as React from 'react';
import { 
    FileText, 
    FileSpreadsheet, 
    Calendar, 
    ChevronRight, 
    BarChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
        return { totalSales, totalCommission, count: filteredOrders.length };
    }, [filteredOrders]);

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
                                <CardTitle className="text-2xl font-black">Rapport Mensuel</CardTitle>
                                <CardDescription className="capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: fr })}</CardDescription>
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

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-sm font-bold text-slate-500">Nombre de commandes</span>
                                <span className="text-sm font-black">{reportStats.count}</span>
                            </div>
                            <div className="flex items-center justify-between px-4">
                                <span className="text-sm font-bold text-slate-500">Taux de croissance</span>
                                <span className="text-sm font-black text-green-500">+12.4%</span>
                            </div>
                            <div className="flex items-center justify-between px-4">
                                <span className="text-sm font-bold text-slate-500">Nouveaux clients</span>
                                <span className="text-sm font-black">24</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 hidden print:block">
                            <h4 className="font-black mb-4">Détail des transactions</h4>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-2">ID</th>
                                        <th className="py-2">Restaurant</th>
                                        <th className="py-2">Total</th>
                                        <th className="py-2">Com.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.slice(0, 10).map(o => (
                                        <tr key={o.id} className="border-b">
                                            <td className="py-2 font-mono">#{o.id.slice(-5)}</td>
                                            <td className="py-2">{o.nomRestaurant}</td>
                                            <td className="py-2">{o.total}</td>
                                            <td className="py-2">{o.montantCommission}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredOrders.length > 10 && <p className="mt-4 text-[10px] italic text-slate-500">... et {filteredOrders.length - 10} autres commandes.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
