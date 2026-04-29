
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { BarChart as BarChartIcon, DollarSign, ShoppingCart, Loader, TrendingUp, CreditCard, Users, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend } from 'recharts';
import type { Order, PaymentMethod } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getPaymentMethod } from '@/lib/payment';

export default function AnalyticsPage() {
    const { user, activeRole } = useAuth();
    const router = useRouter();
    const { orders, restaurants } = useData();
    
    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, activeRole, router]);

    const myRestaurantIds = React.useMemo(() => {
        if (activeRole !== 'restaurateur' || !user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid).map(r => r.id);
    }, [restaurants, activeRole, user]);

    const myOrders = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return orders.filter(o => myRestaurantIds.includes(o.restaurantId) && o.statut === 'Livrée');
    }, [orders, myRestaurantIds]);

    const stats = React.useMemo(() => {
        const totalRevenue = myOrders.reduce((sum, order) => sum + order.revenuNet, 0);
        const totalOrders = myOrders.length;
        const averageOrderValue = totalOrders > 0 ? myOrders.reduce((sum, order) => sum + order.total, 0) / totalOrders : 0;

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue
        };
    }, [myOrders]);
    
    const revenueByRestaurant = React.useMemo(() => {
        const data = restaurants
          .filter(r => myRestaurantIds.includes(r.id))
          .map(restaurant => {
            const restaurantOrders = myOrders.filter(o => o.restaurantId === restaurant.id);
            const revenue = restaurantOrders.reduce((sum, order) => sum + order.revenuNet, 0);
            return {
                name: restaurant.nom.length > 15 ? restaurant.nom.substring(0, 15) + '...' : restaurant.nom,
                revenue
            };
        });
        return data.filter(d => d.revenue > 0);
    }, [myOrders, restaurants, myRestaurantIds]);

    const topSellingItems = React.useMemo(() => {
        const itemMap: { [key: string]: { name: string; count: number; revenue: number } } = {};

        myOrders.forEach(order => {
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
    }, [myOrders]);

    const PAYMENT_COLORS: Record<PaymentMethod, string> = {
        'especes': '#16a34a',
        'wave': '#06b6d4',
        'orange-money': '#f97316',
        'mtn-momo': '#eab308',
        'carte': '#6366f1',
    };

    const revenueByPayment = React.useMemo(() => {
        const map: { [key: string]: { name: string; revenue: number; method: PaymentMethod } } = {};
        myOrders.forEach(order => {
            const method = order.methodePaiement ?? 'especes';
            if (!map[method]) {
                map[method] = { name: getPaymentMethod(method).shortLabel, revenue: 0, method };
            }
            map[method].revenue += order.total;
        });
        return Object.values(map);
    }, [myOrders]);

    const topClients = React.useMemo(() => {
        const map: { [userId: string]: { count: number; total: number } } = {};
        myOrders.forEach(order => {
            if (!map[order.userId]) map[order.userId] = { count: 0, total: 0 };
            map[order.userId].count += 1;
            map[order.userId].total += order.total;
        });
        return Object.entries(map)
            .map(([userId, stats]) => ({ userId, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [myOrders]);

    const ordersByHour = React.useMemo(() => {
        const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}h`, count: 0 }));
        myOrders.forEach(order => {
            const h = new Date(order.date).getHours();
            buckets[h].count += 1;
        });
        return buckets;
    }, [myOrders]);

    const ordersByWeekday = React.useMemo(() => {
        const labels = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
        const buckets = labels.map(label => ({ label, count: 0, revenue: 0 }));
        myOrders.forEach(order => {
            const d = new Date(order.date).getDay();
            buckets[d].count += 1;
            buckets[d].revenue += order.revenuNet;
        });
        // Réordonne lundi → dimanche pour correspondre à la convention FR
        return [...buckets.slice(1), buckets[0]];
    }, [myOrders]);
    
    return (
        <div className="container mx-auto space-y-8">
            <h1 className="text-2xl md:text-3xl font-headline text-primary">Statistiques de performance</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenu Net Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')} FCFA</div>
                        <p className="text-xs text-muted-foreground">Basé sur les commandes livrées (après commission)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nombre de Ventes</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Total des commandes complétées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageOrderValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                        <p className="text-xs text-muted-foreground">Valeur moyenne par commande (TTC)</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Revenu Net par Restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueByRestaurant.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueByRestaurant} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number)/1000}k`} />
                                    <Tooltip
                                        cursor={{fill: 'hsl(var(--muted))'}}
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            return (
                                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                  <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                      Restaurant
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                      {payload[0].payload.name}
                                                    </span>
                                                  </div>
                                                  <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                      Revenu Net
                                                    </span>
                                                    <span className="font-bold">
                                                      {(payload[0].value as number).toLocaleString('fr-FR')} FCFA
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          }
                                          return null
                                        }}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Aucune donnée de revenu pour le moment.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Plats les plus populaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topSellingItems.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plat</TableHead>
                                        <TableHead className="text-center">Ventes</TableHead>
                                        <TableHead className="text-right">Revenu Brut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topSellingItems.map(item => (
                                        <TableRow key={item.name}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.count}</TableCell>
                                            <TableCell className="text-right">{item.revenue.toLocaleString('fr-FR')} FCFA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Aucun plat vendu pour le moment.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Revenus par mode de paiement</CardTitle>
                        <CardDescription>Répartition du chiffre d'affaires brut.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueByPayment.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={revenueByPayment}
                                        dataKey="revenue"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, value }) => `${name} ${(value as number).toLocaleString('fr-FR')}`}
                                    >
                                        {revenueByPayment.map(entry => (
                                            <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Pas encore de paiements enregistrés.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Top 5 clients fidèles</CardTitle>
                        <CardDescription>Clients ayant le plus dépensé chez vous.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topClients.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-center">Commandes</TableHead>
                                        <TableHead className="text-right">Total dépensé</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topClients.map((c, idx) => (
                                        <TableRow key={c.userId}>
                                            <TableCell className="font-medium">#{idx + 1} <span className="text-xs text-muted-foreground">({c.userId.slice(0, 6)}…)</span></TableCell>
                                            <TableCell className="text-center">{c.count}</TableCell>
                                            <TableCell className="text-right">{c.total.toLocaleString('fr-FR')} FCFA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Aucun client fidèle pour le moment.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Heures de pointe</CardTitle>
                        <CardDescription>Distribution des commandes par heure de la journée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {myOrders.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ordersByHour} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="hour" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} interval={1} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Pas encore assez de données.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Revenu net par jour</CardTitle>
                        <CardDescription>Total cumulé sur l'historique.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {myOrders.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ordersByWeekday} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number) / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">Pas encore assez de données.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
