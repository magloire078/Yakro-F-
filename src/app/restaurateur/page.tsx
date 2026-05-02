
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, ChefHat, ClipboardList, BookOpenCheck, DollarSign, ShoppingCart, ArrowRight, Activity, Sparkles, Check, Play, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { Order } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export default function RestaurateurHomePage() {
    const { restaurants, orders, isLoading: isDataLoading } = useData();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);

    const myRestaurantIds = React.useMemo(() => myRestaurants.map(r => r.id), [myRestaurants]);

    const myOrders = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return orders.filter(o => myRestaurantIds.includes(o.restaurantId));
    }, [orders, myRestaurantIds]);

    const stats = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        
        const ordersToday = myOrders.filter(o => o.date.startsWith(today));
        const deliveredToday = ordersToday.filter(o => o.statut === 'Livrée');

        return {
            revenueToday: deliveredToday.reduce((sum, order) => sum + order.revenuNet, 0),
            ordersTodayCount: ordersToday.length,
            pendingCount: myOrders.filter(o => o.statut === 'Placée').length,
            preparingCount: myOrders.filter(o => o.statut === 'En Préparation').length,
            inTransitCount: myOrders.filter(o => o.statut === 'En Route').length,
            latestOrders: myOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
        };
    }, [myOrders]);

    const topItems = React.useMemo(() => {
        const itemMap: { [key: string]: { name: string; count: number; revenue: number } } = {};
        myOrders.filter(o => o.statut === 'Livrée').forEach(order => {
            order.plats.forEach(item => {
                if (!itemMap[item.id]) itemMap[item.id] = { name: item.nom, count: 0, revenue: 0 };
                itemMap[item.id].count += item.quantite;
                const price = item.prix + (item.accompagnementSelectionne?.prix || 0) + (item.boissonSelectionnee?.prix || 0);
                itemMap[item.id].revenue += price * item.quantite;
            });
        });
        return Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 3);
    }, [myOrders]);

    const revenueTrend = React.useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), i);
            return format(d, 'yyyy-MM-dd');
        }).reverse();

        return last7Days.map(date => {
            const dayOrders = myOrders.filter(o => o.date.startsWith(date) && o.statut === 'Livrée');
            return {
                date: format(new Date(date), 'dd/MM'),
                revenue: dayOrders.reduce((sum, o) => sum + o.revenuNet, 0)
            };
        });
    }, [myOrders]);

    const handleStatusUpdate = async (order: Order, newStatus: Order['statut']) => {
        setIsUpdating(order.id);
        try {
            await updateOrderStatusAction({
                orderId: order.id,
                status: newStatus,
                orderData: order
            });
            toast({
                title: "Statut Mis à Jour",
                description: `La commande est maintenant: ${newStatus}`,
            });
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de mettre à jour la commande.",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    if (isDataLoading || authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
                <Loader className="h-12 w-12 animate-spin text-orange-500" />
            </div>
        );
    }
    
    if (myRestaurants.length === 0) {
        return (
             <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full"
                >
                    <Card className="bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl shadow-slate-200/50 p-8 text-center">
                        <CardHeader>
                            <div className="h-20 w-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6">
                                <ChefHat className="h-10 w-10 text-orange-500" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 italic">Bienvenue Elite !</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-slate-500 text-lg leading-relaxed mb-8">
                                Prêt à lancer votre empire culinaire ? Enregistrez votre premier établissement pour commencer à gérer vos commandes.
                            </CardDescription>
                             <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-none transition-all" asChild>
                               <Link href="/dashboard/new-restaurant">
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Créer mon Restaurant
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Section */}
            <div className="relative h-[250px] md:h-[300px] overflow-hidden bg-slate-900 flex items-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070')] bg-cover bg-center opacity-30 scale-110 animate-slow-zoom" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50" />
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4"
                    >
                        <Activity className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Tableau de Bord Elite</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black tracking-tighter text-white italic mb-4"
                    >
                        Gestion <span className="text-orange-500">Premium</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/70 font-medium max-w-xl mx-auto text-sm md:text-lg"
                    >
                        Supervisez vos opérations avec l&apos;excellence Yakro Elite.
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 relative z-20 space-y-8">
                {/* Action Bar */}
                <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 h-auto font-black uppercase tracking-widest text-[10px] shadow-xl">
                       <Link href="/dashboard/orders">
                            <ClipboardList className="mr-2 h-4 w-4 text-orange-500" />
                            Commandes
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="bg-white/70 backdrop-blur-md border-white px-8 py-6 h-auto font-black uppercase tracking-widest text-[10px] shadow-lg hover:border-orange-500/30">
                       <Link href="/dashboard/menu">
                            <BookOpenCheck className="mr-2 h-4 w-4 text-orange-500" />
                            Menu
                        </Link>
                    </Button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Revenu du Jour', value: stats.revenueToday, sub: 'Commandes livrées', icon: DollarSign, unit: 'FCFA' },
                        { label: 'Commandes Total', value: stats.ordersTodayCount, sub: 'Volume journalier', icon: ShoppingCart, unit: 'ITEMS' },
                        { label: 'En Préparation', value: stats.preparingCount, sub: 'Commandes actives', icon: ChefHat, unit: 'PLATS' }
                    ].map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="bg-white/70 backdrop-blur-xl border border-white p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-orange-500 transition-colors">{item.label}</span>
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-all">
                                    <item.icon className="h-4 w-4 text-slate-400 group-hover:text-orange-500" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter text-slate-900 group-hover:text-orange-500 transition-colors">
                                    {item.value.toLocaleString('fr-FR')}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {item.unit}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest">{item.sub}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Latest Orders & Performance */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-8 space-y-8"
                    >
                        {/* Table Card */}
                        <div className="bg-white/70 backdrop-blur-xl border border-white p-0 overflow-hidden shadow-xl">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">Dernières Commandes</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Flux en temps réel</p>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-[10px] font-black uppercase tracking-widest hover:text-orange-500">
                                    <Link href="/dashboard/orders">Tout voir <ArrowRight className="ml-2 h-3 w-3" /></Link>
                                </Button>
                            </div>
                            <div className="p-0">
                                {stats.latestOrders.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-8">Client / Heure</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Statut</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Action</TableHead>
                                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-4 pr-8">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {stats.latestOrders.map((order) => (
                                                    <TableRow key={order.id} className="group hover:bg-slate-50/30 border-slate-50 transition-colors">
                                                        <TableCell className="py-5 pl-8">
                                                            <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{order.nomRestaurant}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                                {format(new Date(order.date), "dd MMM · HH:mm")}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest rounded-none px-3 py-1 border-none",
                                                                order.statut === 'Livrée' ? "bg-green-100 text-green-700" :
                                                                order.statut === 'En Préparation' ? "bg-orange-100 text-orange-700" :
                                                                "bg-slate-100 text-slate-600"
                                                            )}>
                                                                {order.statut}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center gap-2">
                                                                {order.statut === 'Placée' && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        className="h-8 w-8 rounded-none border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                                                        onClick={() => handleStatusUpdate(order, 'En Préparation')}
                                                                        disabled={isUpdating === order.id}
                                                                    >
                                                                        {isUpdating === order.id ? <Loader className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                                {order.statut === 'En Préparation' && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        className="h-8 w-8 rounded-none border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                                        onClick={() => handleStatusUpdate(order, 'Prête')}
                                                                        disabled={isUpdating === order.id}
                                                                    >
                                                                        {isUpdating === order.id ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-5 pr-8">
                                                            <span className="font-black text-slate-900">{order.total.toLocaleString('fr-FR')}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 ml-1">FCFA</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingCart className="h-6 w-6 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune commande pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Revenue Trend Mini Chart */}
                            <div className="bg-white/70 backdrop-blur-xl border border-white p-8 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tendance Revenus</h4>
                                        <p className="text-lg font-black italic text-slate-900">7 derniers jours</p>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="h-[120px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrend}>
                                            <Tooltip 
                                                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                content={({ active, payload }: { active?: boolean; payload?: Array<{ value?: number }> }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900 text-white p-2 text-[10px] font-bold uppercase tracking-widest">
                                                                {payload[0].value?.toLocaleString()} F
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                                                {revenueTrend.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={index === revenueTrend.length - 1 ? '#f97316' : '#e2e8f0'} 
                                                        className="hover:fill-orange-400 transition-colors"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Selling Items */}
                            <div className="bg-white/70 backdrop-blur-xl border border-white p-8 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best-Sellers</h4>
                                        <p className="text-lg font-black italic text-slate-900">Top 3 Plats</p>
                                    </div>
                                    <Sparkles className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="space-y-4">
                                    {topItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-orange-500 bg-orange-50 w-5 h-5 flex items-center justify-center">0{idx+1}</span>
                                                <span className="text-xs font-bold text-slate-700 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-900">{item.count} <span className="text-slate-400">Ventes</span></p>
                                            </div>
                                        </div>
                                    ))}
                                    {topItems.length === 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">En attente de données...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Assistant */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="lg:col-span-4 bg-slate-900 p-8 relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <Wand2 className="h-20 w-20 text-white/5 -rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-orange-500 rounded-none flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white italic leading-tight">
                                Intelligence <span className="text-orange-500 block">Stratégique Yakro</span>
                            </h3>
                            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-none relative">
                                <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Conseil du Jour</p>
                                <p className="text-white/70 text-[11px] font-bold italic leading-relaxed">
                                    {topItems.length > 0 
                                        ? `Votre "${topItems[0].name}" performe exceptionnellement. Créez un pack "Elite" incluant ce plat pour booster vos ventes de 15%.`
                                        : "Analysez vos ventes pour identifier votre plat signature et optimiser votre rentabilité."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 relative z-10">
                            <Button asChild size="lg" className="w-full bg-white hover:bg-orange-500 hover:text-white text-slate-900 font-black uppercase tracking-widest text-[10px] py-6 rounded-none transition-all duration-500">
                               <Link href="/dashboard/new-menu-item">
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Commencer à créer
                                </Link>
                            </Button>
                        </div>
                        
                        {/* Decorative background glow */}
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 bg-orange-500/20 rounded-full blur-[100px]" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
