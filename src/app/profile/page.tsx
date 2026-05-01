
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Loader, User as UserIcon, Mail, Phone, MapPin, Edit, ShoppingBag, BarChart, Heart, LogOut, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import type { Restaurant, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, userProfile, activeRole, updateUserProfile } = useAuth();
  const { orders, restaurants } = useData();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  }

  const userDeliveredOrders = React.useMemo(() => {
    if (!user) return [];
    return orders.filter(o => o.userId === user.uid && o.statut === 'Livrée');
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
  
  const getInitials = (nameOrEmail: string | null | undefined) => {
    if (!nameOrEmail) return '?';
    const nameParts = nameOrEmail.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  }

  if (!user || !userProfile) {
    // This should be handled by layout, but as a fallback
    return null;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl md:text-3xl font-display text-primary mb-8">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 text-3xl">
                <AvatarFallback>{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl truncate">{userProfile?.nom || "Nom non défini"}</CardTitle>
                <CardDescription className="text-lg flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </div>
               <Button asChild>
                  <Link href="/profile/edit">
                    <Edit className="mr-2" />
                    Modifier
                  </Link>
                </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-4 text-muted-foreground" />
                <span className="font-medium">{userProfile?.telephone || "Non défini"}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-4 mt-1 text-muted-foreground" />
                <div>
                    <p className="font-medium">{userProfile?.adresseParDefaut || "Non définie"}</p>
                    <p className="text-sm text-muted-foreground">Adresse par défaut</p>
                </div>
              </div>
                 <Separator />
                 <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                    </Button>
                 </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats (only for clients) */}
        {activeRole === 'client' && (
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Statistiques Client</CardTitle>
                        <CardDescription>Votre activité sur Yakro Fê.</CardDescription>
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
                                <p className="font-bold text-lg">{stats.favoriteRestaurant?.nom || 'Indéfini'}</p>
                                <p className="text-sm text-muted-foreground">Restaurant favori</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
}
