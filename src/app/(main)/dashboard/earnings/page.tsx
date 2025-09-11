
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Loader, DollarSign, Bike, TrendingUp, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/types';

export default function EarningsPage() {
    const { user, loading: authLoading, activeRole } = useAuth();
    const router = useRouter();
    const { orders, isLoading: dataLoading } = useData();
    
    React.useEffect(() => {
        if (!authLoading && user && activeRole !== 'livreur') {
            router.push('/');
        }
    }, [user, authLoading, activeRole, router]);
    
    const myCompletedDeliveries = React.useMemo(() => {
        if (!user || activeRole !== 'livreur') return [];
        return orders.filter(o => o.livreurId === user.uid && o.statut === 'Livrée');
    }, [orders, user, activeRole]);

    const stats = React.useMemo(() => {
        const totalEarnings = myCompletedDeliveries.reduce((sum, order) => sum + order.fraisDeLivraison, 0);
        const completedCount = myCompletedDeliveries.length;
        const averageEarning = completedCount > 0 ? totalEarnings / completedCount : 0;
        
        return {
            totalEarnings,
            completedCount,
            averageEarning,
        };
    }, [myCompletedDeliveries]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto space-y-8">
            <h1 className="text-3xl md:text-4xl font-headline text-primary">Mes Gains & Historique</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEarnings.toLocaleString('fr-FR')} FCFA</div>
                        <p className="text-xs text-muted-foreground">Total des frais de livraison perçus</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courses Terminées</CardTitle>
                        <Bike className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completedCount}</div>
                        <p className="text-xs text-muted-foreground">Nombre total de livraisons effectuées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gain Moyen / Course</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageEarning.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                        <p className="text-xs text-muted-foreground">Revenu moyen par livraison</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History/> Historique des courses</CardTitle>
                </CardHeader>
                <CardContent>
                    {myCompletedDeliveries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Vos Gains</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myCompletedDeliveries.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell>{order.nomRestaurant}</TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-600">{order.statut}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground pt-12">Aucune course terminée pour le moment. Acceptez votre première course pour commencer !</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
