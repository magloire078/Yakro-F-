
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Loader, User as UserIcon, Mail, Phone, MapPin, Edit, ShoppingBag, BarChart, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/lib/types';

export default function ProfilePage() {
  const { user, loading: authLoading, activeRole } = useAuth();
  const { orders, restaurants, isLoading: dataLoading } = useData();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && activeRole !== 'customer') {
      toast({
        variant: 'destructive',
        title: 'Accès non autorisé',
        description: 'La page de profil est uniquement disponible pour les clients.',
      });
      router.push('/');
    }
  }, [user, authLoading, activeRole, router, toast]);

  const userDeliveredOrders = React.useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.uid && o.status === 'Livrée');
  }, [orders, user]);

  const stats = React.useMemo(() => {
    const totalSpent = userDeliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const restaurantFrequency: { [key: string]: number } = {};
    userDeliveredOrders.forEach(order => {
      restaurantFrequency[order.restaurantId] = (restaurantFrequency[order.restaurantId] || 0) + 1;
    });

    const favoriteRestaurantId = Object.keys(restaurantFrequency).length > 0
      ? Object.keys(restaurantFrequency).reduce((a, b) => restaurantFrequency[a] > restaurantFrequency[b] ? a : b)
      : null;

    const favoriteRestaurant = favoriteRestaurantId ? restaurants.find(r => r.id === favoriteRestaurantId) : null;

    return {
      orderCount: userDeliveredOrders.length,
      totalSpent: totalSpent.toLocaleString('fr-FR'),
      favoriteRestaurant: favoriteRestaurant,
    };
  }, [userDeliveredOrders, restaurants]);
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  }

  if (authLoading || dataLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Mock data for now
  const profile = {
    name: "Aisha Koné",
    phone: "07 01 02 03 04",
    defaultAddress: "Yamoussoukro, Quartier des Lacs, Villa 24"
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 text-3xl">
                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <CardTitle className="text-3xl">{profile.name}</CardTitle>
                <CardDescription className="text-lg flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-4 text-muted-foreground" />
                <span className="font-medium">{profile.phone}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                <div>
                    <p className="font-medium">{profile.defaultAddress}</p>
                    <p className="text-sm text-muted-foreground">Adresse par défaut</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats */}
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                    <CardDescription>Votre activité sur Yakro Go.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <ShoppingBag className="h-6 w-6 text-primary"/>
                        </div>
                        <div>
                            <p className="font-bold text-2xl">{stats.orderCount}</p>
                            <p className="text-sm text-muted-foreground">Commandes passées</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <BarChart className="h-6 w-6 text-green-600"/>
                        </div>
                        <div>
                            <p className="font-bold text-2xl">{stats.totalSpent} FCFA</p>
                            <p className="text-sm text-muted-foreground">Dépenses totales</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <Heart className="h-6 w-6 text-red-600"/>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{stats.favoriteRestaurant?.name || 'Indéfini'}</p>
                            <p className="text-sm text-muted-foreground">Restaurant favori</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
