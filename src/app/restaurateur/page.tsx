
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
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

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
                <Loader className="h-12 w-12 animate-spin text-primary" />
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
                            <div className="h-20 w-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <ChefHat className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 italic">Bienvenue Elite !</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-slate-500 text-lg leading-relaxed mb-8">
                                Prêt à lancer votre empire culinaire ? Enregistrez votre premier établissement pour commencer à gérer vos commandes.
                            </CardDescription>
                             <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-none transition-all" asChild>
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
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070",
                badgeIcon: <Activity className="h-3.5 w-3.5" />,
                badgeText: "Tableau de Bord Elite",
                title: <>Gestion <span className="text-primary">Premium</span></>,
                subtitle: "Supervisez vos opérations avec l'excellence Yakro Elite.",
                children: (
                    <DashboardStats 
                        items={[
                            { 
                                label: 'Revenu du Jour', 
                                value: stats.revenueToday, 
                                unit: 'FCFA', 
                                icon: DollarSign, 
                                color: 'emerald',
                                growth: 12 // Simulated for now
                            },
                            { 
                                label: 'Commandes', 
                                value: stats.ordersTodayCount, 
                                unit: 'ITEMS', 
                                icon: ShoppingCart, 
                                color: 'orange' 
                            },
                            { 
                                label: 'En Préparation', 
                                value: stats.preparingCount, 
                                unit: 'PLATS', 
                                icon: ChefHat 
                            }
                        ]}
                    />
                )
            }}
        >
            <div className="space-y-4 sm:space-y-8">
                {/* Action Bar */}
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4">
                    <Button asChild className="bg-slate-900/80 hover:bg-slate-900 text-white px-5 sm:px-8 py-3 sm:py-5 h-auto font-black uppercase tracking-wider text-[9px] sm:text-[10px] shadow-lg backdrop-blur-md border border-white/10 rounded-xl">
                       <Link href="/dashboard/orders">
                            <ClipboardList className="mr-1.5 h-3.5 w-3.5 text-primary" />
                            Commandes
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="bg-white/10 backdrop-blur-md border-white/10 px-5 sm:px-8 py-3 sm:py-5 h-auto font-black uppercase tracking-wider text-[9px] sm:text-[10px] shadow-md hover:border-primary/30 text-white rounded-xl">
                       <Link href="/dashboard/menu">
                            <BookOpenCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                            Menu
                        </Link>
                    </Button>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
                    {/* Latest Orders & Performance */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-8 space-y-4 sm:space-y-8"
                    >
                        {/* Table Card */}
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-0 overflow-hidden shadow-lg rounded-2xl sm:rounded-3xl">
                            <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Dernières Commandes</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Flux en temps réel</p>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider hover:text-primary h-7 px-2">
                                    <Link href="/dashboard/orders">Tout voir <ArrowRight className="ml-1.5 h-3 w-3" /></Link>
                                </Button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                {stats.latestOrders.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-2.5 sm:py-4 pl-4 sm:pl-8">Client / Heure</TableHead>
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Statut</TableHead>
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center">Action</TableHead>
                                                <TableHead className="text-right text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-2.5 sm:py-4 pr-4 sm:pr-8">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {stats.latestOrders.map((order) => (
                                                    <TableRow key={order.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 border-slate-50 dark:border-slate-800 transition-colors">
                                                        <TableCell className="py-3 sm:py-4 pl-4 sm:pl-8">
                                                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">{order.nomRestaurant}</div>
                                                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                                {format(new Date(order.date), "dd MMM · HH:mm")}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                "text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-lg px-2 py-0.5 border-none",
                                                                order.statut === 'Livrée' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                order.statut === 'En Préparation' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                            )}>
                                                                {order.statut}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center gap-1.5">
                                                                {order.statut === 'Placée' && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
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
                                                                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                                                        onClick={() => handleStatusUpdate(order, 'Prête')}
                                                                        disabled={isUpdating === order.id}
                                                                    >
                                                                        {isUpdating === order.id ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3 sm:py-4 pr-4 sm:pr-8">
                                                            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">{order.total.toLocaleString('fr-FR')}</span>
                                                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 ml-1">F</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-10 sm:py-16">
                                        <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <ShoppingCart className="h-5 w-5 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Aucune commande pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Revenue Trend Mini Chart */}
                            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-4 sm:p-6 shadow-md rounded-2xl sm:rounded-3xl">
                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                    <div>
                                        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Tendance Revenus</h4>
                                        <p className="text-base sm:text-lg font-black italic text-slate-900 dark:text-white">7 derniers jours</p>
                                    </div>
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <div className="h-[100px] sm:h-[120px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrend}>
                                            <Tooltip 
                                                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                content={({ active, payload }: { active?: boolean; payload?: Array<{ value?: number }> }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900 text-white p-1.5 text-[9px] font-bold uppercase tracking-wider rounded">
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
                            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-4 sm:p-6 shadow-md rounded-2xl sm:rounded-3xl">
                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                    <div>
                                        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Best-Sellers</h4>
                                        <p className="text-base sm:text-lg font-black italic text-slate-900 dark:text-white">Top 3 Plats</p>
                                    </div>
                                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <div className="space-y-2.5 sm:space-y-3">
                                    {topItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[9px] font-black text-primary bg-primary/10 w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center">0{idx+1}</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors uppercase tracking-tight truncate max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white">{item.count} <span className="text-slate-400 font-normal">Ventes</span></p>
                                            </div>
                                        </div>
                                    ))}
                                    {topItems.length === 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">En attente de données...</p>
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
                        className="lg:col-span-4 bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <Wand2 className="h-16 w-16 sm:h-20 sm:w-20 text-white/5 -rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-primary/20">
                                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white italic leading-tight">
                                Intelligence <span className="text-primary block">Stratégique Yakro</span>
                            </h3>
                            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl relative">
                                <p className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1">Conseil du Jour</p>
                                <p className="text-white/70 text-[11px] sm:text-xs font-bold italic leading-relaxed">
                                    {topItems.length > 0 
                                        ? `Votre "${topItems[0].name}" performe exceptionnellement. Créez un pack "Elite" incluant ce plat pour booster vos ventes de 15%.`
                                        : "Analysez vos ventes pour identifier votre plat signature et optimiser votre rentabilité."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-8 relative z-10">
                            <Button asChild size="sm" className="w-full bg-white hover:bg-primary hover:text-white text-slate-900 font-bold uppercase tracking-wider text-[10px] h-10 sm:h-12 rounded-xl transition-all duration-300">
                               <Link href="/dashboard/new-menu-item">
                                    <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                                    Créer un nouveau plat
                                </Link>
                            </Button>
                        </div>
                        
                        {/* Decorative background glow */}
                        <div className="absolute -bottom-20 -left-20 h-48 w-48 bg-primary/20 rounded-full blur-[80px]" />
                    </motion.div>
                </div>
            </div>
        </DashboardPage>
    );
}


