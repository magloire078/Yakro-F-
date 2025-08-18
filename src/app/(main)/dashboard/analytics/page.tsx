
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { BarChart as BarChartIcon, DollarSign, ShoppingCart, Loader, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { Order } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
    const { user, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const { orders, restaurants, isLoading: dataLoading } = useData();
    
    React.useEffect(() => {
        if (!authLoading && user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, authLoading, activeRole, router]);

    const myRestaurantIds = React.useMemo(() => {
        if (activeRole !== 'restaurateur' || !user) return [];
        return restaurants.filter(r => r.ownerId === user.uid).map(r => r.id);
    }, [restaurants, activeRole, user]);

    const myOrders = React.useMemo(() => {
        if (myRestaurantIds.length === 0) return [];
        return orders.filter(o => myRestaurantIds.includes(o.restaurantId) && o.status === 'Livrée');
    }, [orders, myRestaurantIds]);

    const stats = React.useMemo(() => {
        const totalRevenue = myOrders.reduce((sum, order) => sum + order.netRevenue, 0);
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
            const revenue = restaurantOrders.reduce((sum, order) => sum + order.netRevenue, 0);
            return {
                name: restaurant.name.length > 15 ? restaurant.name.substring(0, 15) + '...' : restaurant.name,
                revenue
            };
        });
        return data.filter(d => d.revenue > 0);
    }, [myOrders, restaurants, myRestaurantIds]);

    const topSellingItems = React.useMemo(() => {
        const itemMap: { [key: string]: { name: string; count: number; revenue: number } } = {};

        myOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemMap[item.id]) {
                    itemMap[item.id] = { name: item.name, count: 0, revenue: 0 };
                }
                itemMap[item.id].count += item.quantity;
                const itemPrice = item.price + (item.selectedSide?.price || 0) + (item.selectedDrink?.price || 0);
                itemMap[item.id].revenue += itemPrice * item.quantity;
            });
        });

        return Object.values(itemMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [myOrders]);


    if (authLoading || dataLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto space-y-8">
            <h1 className="text-3xl md:text-4xl font-headline text-primary">Statistiques de performance</h1>
            
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
        </div>
    );
}
