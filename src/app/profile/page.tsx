
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Loader, User as UserIcon, Mail, Phone, MapPin, Edit, ShoppingBag, BarChart, Heart, LogOut, ShieldAlert, Sparkles, Trophy, Gift, Copy, Check, Share2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLoyalty } from '@/hooks/use-loyalty';
import { Badge } from '@/components/ui/badge';
import { buildShareMessage, FILLEUL_DISCOUNT_FCFA, PARRAIN_BONUS_POINTS } from '@/lib/referrals';
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
  const { points, tier, tierInfo, progress, pointsToNext, parrainBonusPoints, filleulCount } = useLoyalty();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async () => {
    if (!userProfile?.codeParrainage) return;
    try {
      await navigator.clipboard.writeText(userProfile.codeParrainage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Copie impossible', description: 'Sélectionnez et copiez manuellement.' });
    }
  };

  const handleShare = async () => {
    if (!userProfile?.codeParrainage) return;
    const message = buildShareMessage(userProfile.codeParrainage);
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'Yakro Fê', text: message });
        return;
      } catch {
        /* ignore : fallback sur le presse-papiers */
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Message copié', description: 'Collez-le dans WhatsApp ou un SMS pour inviter un ami.' });
    } catch {
      toast({ variant: 'destructive', title: 'Partage impossible' });
    }
  };
  
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
      <h1 className="text-2xl md:text-3xl font-headline text-primary mb-8">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 text-3xl">
                <AvatarFallback>{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <CardTitle className="text-3xl">{userProfile?.nom || "Nom non défini"}</CardTitle>
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
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-pink-500" />
                            Parrainez vos amis
                        </CardTitle>
                        <CardDescription>
                            Vos amis reçoivent {FILLEUL_DISCOUNT_FCFA.toLocaleString('fr-FR')} FCFA, vous gagnez {PARRAIN_BONUS_POINTS} points par filleul actif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {userProfile.codeParrainage ? (
                            <>
                                <div className="rounded-md border bg-muted/50 p-3 flex items-center justify-between gap-2">
                                    <code className="font-mono font-bold tracking-wider">{userProfile.codeParrainage}</code>
                                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? 'Copié' : 'Copier'}
                                    </Button>
                                </div>
                                <Button onClick={handleShare} variant="default" className="w-full">
                                    <Share2 className="h-4 w-4" />
                                    Partager mon code
                                </Button>
                                {filleulCount > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {filleulCount} filleul{filleulCount > 1 ? 's' : ''} actif{filleulCount > 1 ? 's' : ''} • +{parrainBonusPoints} pts cumulés.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Votre code sera généré automatiquement à votre prochaine connexion.</p>
                        )}
                        {userProfile.parraineParCode ? (
                            <div className="rounded-md border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200 space-y-1">
                                <p className="font-medium flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Vous avez été parrainé
                                </p>
                                <p className="text-xs">
                                    Code utilisé : <strong>{userProfile.parraineParCode}</strong>.{' '}
                                    {userProfile.bonusParrainageUtilise
                                        ? 'Bonus déjà appliqué.'
                                        : `${FILLEUL_DISCOUNT_FCFA.toLocaleString('fr-FR')} FCFA seront déduits sur votre prochaine commande.`}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Vous avez été parrainé par un ami ?{' '}
                                <Link href="/profile/edit" className="text-primary underline">
                                    Saisissez son code
                                </Link>{' '}
                                avant votre première commande.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card style={{ borderColor: tierInfo.color }} className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" style={{ color: tierInfo.color }} />
                            Fidélité — niveau {tier}
                        </CardTitle>
                        <CardDescription>{points} points cumulés</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {tierInfo.nextThreshold ? (
                            <div className="space-y-1">
                                <Progress value={progress * 100} />
                                <p className="text-xs text-muted-foreground">
                                    Encore {pointsToNext} points pour passer {tierInfo.nextTier}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Vous êtes au plus haut niveau. Bravo !</p>
                        )}
                        <ul className="space-y-1 text-sm">
                            {tierInfo.perks.map(perk => (
                                <li key={perk} className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    {perk}
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-muted-foreground">
                            Vous gagnez 1 point pour chaque tranche de 100 FCFA dépensée (commande livrée).
                        </p>
                    </CardContent>
                </Card>
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
