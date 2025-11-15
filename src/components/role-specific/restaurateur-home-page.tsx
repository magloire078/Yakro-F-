
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/data-context';
import { Loader, Wand2, ChefHat, ClipboardList, BookOpenCheck, DollarSign, ShoppingCart, CookingPot, Bike, Users, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MenuItem, type Restaurant } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format }s from 'date-fns';

export default function RestaurateurHomePage() {
    const { restaurants, menuItems, orders, isLoading: isDataLoading } = useData();
    const [myRestaurants, setMyRestaurants] = React.useState<Restaurant[]>([]);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (user) {
            const userRestaurants = restaurants.filter(r => r.proprietaireId === user.uid);
            setMyRestaurants(userRestaurants);
        }
    }, [restaurants, user]);

    const myRestaurantIds = React.useMemo(() => myRestaurants.map(r => r.id), [myRestaurants]);

    const stats = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const myOrders = orders.filter(o => myRestaurantIds.includes(o.restaurantId));
        
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
    }, [orders, myRestaurantIds]);

    if (isDataLoading || authLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (myRestaurants.length === 0) {
        return (
             <div className="flex h-full w-full items-center justify-center">
                <Card className="max-w-lg text-center p-8">
                    <CardHeader>
                        <ChefHat className="h-16 w-16 mx-auto text-primary" />
                        <CardTitle className="text-2xl mt-4">Bienvenue sur votre espace restaurateur !</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                            Il semble que vous n'ayez pas encore de restaurant. Pour commencer à gérer vos commandes et créer des plats, vous devez d'abord enregistrer votre établissement.
                        </CardDescription>
                         <Button className="mt-6" asChild>
                           <Link href="/dashboard/new-restaurant">Créer mon premier restaurant</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-headline text-primary">Tableau de bord</h1>
                    <p className="text-muted-foreground">Aperçu de l'activité de vos restaurants aujourd'hui.</p>
                </div>
                 <div className="flex gap-2">
                    <Button asChild>
                       <Link href="/dashboard/orders">
                            <ClipboardList />
                            Gérer les commandes
                        </Link>
                    </Button>
                     <Button asChild variant="outline">
                       <Link href="/dashboard/menu">
                            <BookOpenCheck />
                           Voir mes menus
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenu Net (Aujourd'hui)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.revenueToday.toLocaleString('fr-FR')} FCFA</div>
                        <p className="text-xs text-muted-foreground">Basé sur les commandes livrées</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commandes (Aujourd'hui)</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ordersTodayCount}</div>
                        <p className="text-xs text-muted-foreground">Toutes les commandes reçues ce jour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Statut des Commandes Actives</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex justify-around pt-2">
                        <div className="text-center">
                            <p className="text-lg font-bold">{stats.pendingCount}</p>
                            <p className="text-xs text-muted-foreground">En attente</p>
                        </div>
                         <div className="text-center">
                            <p className="text-lg font-bold">{stats.preparingCount}</p>
                            <p className="text-xs text-muted-foreground">En prépa.</p>
                        </div>
                         <div className="text-center">
                            <p className="text-lg font-bold">{stats.inTransitCount}</p>
                            <p className="text-xs text-muted-foreground">En route</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Dernières Commandes</CardTitle>
                        <CardDescription>Voici les 5 dernières commandes reçues par vos établissements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {stats.latestOrders.length > 0 ? (
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.latestOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="font-medium">{order.nomRestaurant}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {format(new Date(order.date), "dd/MM/yyyy HH:mm")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{order.statut}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{order.total.toLocaleString('fr-FR')} FCFA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                       ) : (
                           <p className="text-muted-foreground text-center py-8">Aucune commande pour le moment.</p>
                       )}
                       <div className="mt-4 flex justify-end">
                           <Button variant="ghost" asChild>
                               <Link href="/dashboard/orders">
                                   Voir toutes les commandes <ArrowRight className="ml-2" />
                               </Link>
                           </Button>
                       </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Créateur de Plats par IA</CardTitle>
                        <CardDescription>Pas d'inspiration ? Décrivez un plat et laissez l'IA générer un nom, une description et un prix pour vous.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Wand2 className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                        <p className="text-muted-foreground mb-6">Ajoutez rapidement de nouveaux plats à vos menus en utilisant notre assistant intelligent.</p>
                        <Button asChild size="lg">
                           <Link href="/dashboard/new-menu-item">
                                <Wand2 />
                                Commencer à créer
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
