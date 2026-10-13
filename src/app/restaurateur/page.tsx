
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, ChefHat, ClipboardList, BookOpenCheck, DollarSign, ShoppingCart, ArrowRight, Activity, Sparkles, Check, Play, TrendingUp, MapPinned, Store, Star } from 'lucide-react';
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
import { OperationsMap } from '@/components/map/operations-map';
import { FoodImage } from '@/components/food-image';

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
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (myRestaurants.length === 0) {
        return (
             <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full"
                >
                    <Card className="bg-card/70 backdrop-blur-xl border-border shadow-2xl p-8 text-center">
                        <CardHeader>
                            <div className="h-20 w-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <ChefHat className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight text-foreground italic">Bienvenue Elite !</CardTitle>
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
                                growth: 12
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
                                icon: ChefHat,
                                color: 'white'
                            },
                            {
                                label: 'Bastions Actifs',
                                value: myRestaurants.length,
                                unit: 'SITES',
                                icon: Store,
                                color: 'emerald'
                            }
                        ]}
                    />
                )
            }}
        >
            <div className="space-y-4 sm:space-y-8">
                {/* Quick Action Hub - 2 cartes par ligne sur mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
                    <Link 
                        href="/dashboard/orders" 
                        className="group relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-orange-500/50 hover:shadow-orange-500/10 hover:scale-[1.02] flex items-center gap-2.5 sm:gap-3 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform">
                            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-headline font-black text-foreground truncate group-hover:text-orange-500 transition-colors">Commandes</h3>
                            <p className="text-[8px] sm:text-[10px] font-body font-semibold text-muted-foreground truncate">{stats.ordersTodayCount} auj. &bull; {stats.pendingCount + stats.preparingCount} en cours</p>
                        </div>
                    </Link>

                    <Link 
                        href="/dashboard/menu" 
                        className="group relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:scale-[1.02] flex items-center gap-2.5 sm:gap-3 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <BookOpenCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-headline font-black text-foreground truncate group-hover:text-emerald-500 transition-colors">Menus & Plats</h3>
                            <p className="text-[8px] sm:text-[10px] font-body font-semibold text-muted-foreground truncate">Gérer la carte</p>
                        </div>
                    </Link>

                    <Link 
                        href="/dashboard/my-restaurants" 
                        className="group relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-orange-500/50 hover:shadow-orange-500/10 hover:scale-[1.02] flex items-center gap-2.5 sm:gap-3 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
                            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-headline font-black text-foreground truncate group-hover:text-primary transition-colors">Mes Bastions</h3>
                            <p className="text-[8px] sm:text-[10px] font-body font-semibold text-muted-foreground truncate">{myRestaurants.length} établissement{myRestaurants.length > 1 ? 's' : ''}</p>
                        </div>
                    </Link>

                    <Link 
                        href="/dashboard/new-menu-item" 
                        className="group relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:scale-[1.02] flex items-center gap-2.5 sm:gap-3 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-headline font-black text-foreground truncate group-hover:text-emerald-500 transition-colors">Nouveau Plat</h3>
                            <p className="text-[8px] sm:text-[10px] font-body font-semibold text-muted-foreground truncate">Ajouter à la carte</p>
                        </div>
                    </Link>
                </div>

                {/* Mes Bastions Culinaire - 2 cartes par ligne sur mobile */}
                {myRestaurants.length > 0 && (
                    <div className="space-y-2.5 sm:space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className="flex h-2 w-5 rounded-full overflow-hidden">
                                    <div className="flex-1 bg-orange-500" />
                                    <div className="flex-1 bg-white" />
                                    <div className="flex-1 bg-emerald-500" />
                                </div>
                                <h3 className="text-xs sm:text-sm font-headline font-black uppercase italic tracking-wider text-foreground">
                                    Mes Bastions <span className="text-primary">Culinaire</span>
                                </h3>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary h-7 px-2">
                                <Link href="/dashboard/my-restaurants">Gérer tout <ArrowRight className="ml-1 h-3 w-3" /></Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                            {myRestaurants.map((restaurant) => {

                                return (
                                    <Link 
                                        key={restaurant.id} 
                                        href={`/dashboard/my-restaurants/edit?id=${restaurant.id}`}
                                        className="group relative block overflow-hidden rounded-xl sm:rounded-2xl border border-border dark:border-white/10 bg-card/70 dark:bg-white/5 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:scale-[1.02]"
                                    >
                                        <div className="aspect-[16/10] relative overflow-hidden">
                                            <FoodImage
                                                src={restaurant.image}
                                                alt={restaurant.nom}
                                                kind="restaurant"
                                                sizes="(max-width: 640px) 50vw, 25vw"
                                                className="transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                            <div className="absolute top-2 left-2 flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider shadow">
                                                    {restaurant.suspendu ? 'Suspendu' : 'Ouvert'}
                                                </span>
                                            </div>
                                            {restaurant.note !== undefined && (
                                                <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-400 text-[8px] sm:text-[9px] font-black">
                                                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                                                    <span>{restaurant.note.toFixed(1)}</span>
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <h4 className="text-xs sm:text-sm font-headline font-black text-white truncate group-hover:text-primary transition-colors">
                                                    {restaurant.nom}
                                                </h4>
                                                <p className="text-[8px] sm:text-[10px] text-white/70 font-body truncate">
                                                    {restaurant.cuisine || restaurant.adresse || 'Cuisine locale'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Live Map */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card/70 backdrop-blur-xl border border-border shadow-lg rounded-2xl sm:rounded-3xl overflow-hidden"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500" />
                    <div className="p-3 sm:p-5 flex flex-wrap items-center justify-between gap-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <MapPinned className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground">Carte en direct</h2>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Vos établissements &bull; livreurs en route &bull; clients
                        </p>
                    </div>
                    <OperationsMap
                        restaurants={myRestaurants}
                        orders={myOrders}
                        livreurScope="assigned"
                        className="h-56 sm:h-80"
                    />
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
                    {/* Latest Orders & Performance */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-8 space-y-4 sm:space-y-8"
                    >
                        {/* Table Card */}
                        <div className="bg-card/70 dark:bg-white/5 backdrop-blur-xl border border-border dark:border-white/10 p-0 overflow-hidden shadow-lg rounded-xl sm:rounded-3xl">
                            <div className="p-3.5 sm:p-6 border-b border-border dark:border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">Dernières Commandes</h3>
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Flux en temps réel</p>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider hover:text-primary h-7 px-2">
                                    <Link href="/dashboard/orders">Tout voir <ArrowRight className="ml-1.5 h-3 w-3" /></Link>
                                </Button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                {stats.latestOrders.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-muted/30 dark:bg-white/5">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-2.5 sm:py-3.5 pl-3 sm:pl-6">Client / Heure</TableHead>
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Statut</TableHead>
                                                <TableHead className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center">Action</TableHead>
                                                <TableHead className="text-right text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-2.5 sm:py-3.5 pr-3 sm:pr-6">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {stats.latestOrders.map((order) => (
                                                    <TableRow key={order.id} className="group hover:bg-muted/20 dark:hover:bg-white/5 border-border dark:border-white/5 transition-colors">
                                                        <TableCell className="py-2.5 sm:py-3.5 pl-3 sm:pl-6">
                                                            <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[110px] sm:max-w-none">{order.nomRestaurant}</div>
                                                            <div className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                                                                {format(new Date(order.date), "dd MMM · HH:mm")}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                "text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md px-1.5 sm:px-2 py-0.5 border",
                                                                order.statut === 'Livrée' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                                                order.statut === 'En Préparation' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                                                                "bg-muted text-muted-foreground border-border"
                                                            )}>
                                                                {order.statut}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center gap-1">
                                                                {order.statut === 'Placée' && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                                                                        onClick={() => handleStatusUpdate(order, 'En Préparation')}
                                                                        disabled={isUpdating === order.id}
                                                                        aria-label="Passer en préparation"
                                                                    >
                                                                        {isUpdating === order.id ? <Loader className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                                {order.statut === 'En Préparation' && (
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="outline" 
                                                                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                                                        onClick={() => handleStatusUpdate(order, 'Prête')}
                                                                        disabled={isUpdating === order.id}
                                                                        aria-label="Marquer comme prête"
                                                                    >
                                                                        {isUpdating === order.id ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-2.5 sm:py-3.5 pr-3 sm:pr-6">
                                                            <span className="font-black text-xs sm:text-sm text-foreground">{order.total.toLocaleString('fr-FR')}</span>
                                                            <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground ml-0.5">F</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 sm:py-14">
                                        <div className="h-9 w-9 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aucune commande pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Grid - 2 cartes par ligne en tablette/desktop, compact sur mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
                            {/* Revenue Trend Mini Chart */}
                            <div className="bg-card/70 dark:bg-white/5 backdrop-blur-xl border border-border dark:border-white/10 p-3.5 sm:p-5 shadow-md rounded-xl sm:rounded-2xl">
                                <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                                    <div>
                                        <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-muted-foreground">Tendance Revenus</h4>
                                        <p className="text-sm sm:text-base font-black italic text-foreground">7 derniers jours</p>
                                    </div>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="h-[90px] sm:h-[110px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrend}>
                                            <Tooltip 
                                                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                content={({ active, payload }: { active?: boolean; payload?: Array<{ value?: number }> }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900 text-white p-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded shadow-lg">
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
                                                        fill={index === revenueTrend.length - 1 ? '#f97316' : '#10b981'} 
                                                        className="hover:opacity-80 transition-opacity"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Selling Items */}
                            <div className="bg-card/70 dark:bg-white/5 backdrop-blur-xl border border-border dark:border-white/10 p-3.5 sm:p-5 shadow-md rounded-xl sm:rounded-2xl">
                                <div className="flex justify-between items-center mb-2.5 sm:mb-3">
                                    <div>
                                        <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-muted-foreground">Best-Sellers</h4>
                                        <p className="text-sm sm:text-base font-black italic text-foreground">Top 3 Plats</p>
                                    </div>
                                    <Sparkles className="h-4 w-4 text-orange-500" />
                                </div>
                                <div className="space-y-2 sm:space-y-2.5">
                                    {topItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[8px] font-black w-4 h-4 rounded flex items-center justify-center border",
                                                    idx === 0 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                    idx === 1 ? "bg-muted text-foreground border-border" :
                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                )}>
                                                    0{idx+1}
                                                </span>
                                                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate max-w-[130px] sm:max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-foreground">{item.count} <span className="text-muted-foreground font-normal">Ventes</span></p>
                                            </div>
                                        </div>
                                    ))}
                                    {topItems.length === 0 && (
                                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">En attente de données...</p>
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
                        className="lg:col-span-4 bg-slate-900 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5"
                    >
                        <div className="absolute top-0 right-0 p-3 sm:p-4">
                            <Wand2 className="h-14 w-14 sm:h-20 sm:w-20 text-white/5 -rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="h-9 w-9 sm:h-12 sm:w-12 bg-primary rounded-xl flex items-center justify-center mb-3 sm:mb-6 shadow-md shadow-primary/20">
                                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white italic leading-tight">
                                Intelligence <span className="text-primary block">Stratégique Yakro</span>
                            </h3>
                            <div className="mt-3 sm:mt-6 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl relative">
                                <p className="text-emerald-400 text-[8px] sm:text-[9px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Conseil du Jour
                                </p>
                                <p className="text-white/80 text-[11px] sm:text-xs font-bold italic leading-relaxed">
                                    {topItems.length > 0 
                                        ? `Votre "${topItems[0].name}" performe exceptionnellement. Créez un pack "Elite" incluant ce plat pour booster vos ventes de 15%.`
                                        : "Analysez vos ventes pour identifier votre plat signature et optimiser votre rentabilité."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-8 relative z-10">
                            <Button asChild size="sm" className="w-full bg-white hover:bg-primary hover:text-white text-slate-900 font-bold uppercase tracking-wider text-[10px] h-10 sm:h-12 rounded-xl transition-all duration-300">
                               <Link href="/dashboard/new-menu-item">
                                    <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                                    Créer un nouveau plat
                                </Link>
                            </Button>
                        </div>
                        
                        {/* Decorative background tricolor glow */}
                        <div className="absolute -bottom-20 -left-20 h-44 w-44 bg-emerald-500/15 rounded-full blur-[80px]" />
                        <div className="absolute -top-20 -right-20 h-44 w-44 bg-orange-500/15 rounded-full blur-[80px]" />
                    </motion.div>
                </div>
            </div>
        </DashboardPage>
    );
}


