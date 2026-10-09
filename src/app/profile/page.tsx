
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Mail, Phone, MapPin, Edit, ShoppingBag, BarChart, Heart, LogOut, Gift, Copy, Award, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, setDoc } from 'firebase/firestore';
import { initiatePremiumSubscriptionPaymentAction } from '@/app/actions/premium-actions';
import { isPremiumActive, PREMIUM_PRICE_FCFA, PREMIUM_DURATION_DAYS } from '@/lib/premium';

const MOBILE_MONEY_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_MOBILE_MONEY_ENABLED === 'true';

export default function ProfilePage() {
  const { user, userProfile, activeRole } = useAuth();
  const { orders, restaurants } = useData();
  const { auth, db } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  }

  const handleSubscribePremium = async () => {
    if (!user) return;
    setIsSubscribing(true);
    try {
      const subscriptionRef = doc(collection(db, 'abonnements'));
      await setDoc(subscriptionRef, {
        userId: user.uid,
        montant: PREMIUM_PRICE_FCFA,
        dureeJours: PREMIUM_DURATION_DAYS,
        paiement: { mode: 'orange_money', statut: 'en_attente', montant: PREMIUM_PRICE_FCFA },
        dateCreation: new Date().toISOString(),
      });

      const idToken = await user.getIdToken();
      const result = await initiatePremiumSubscriptionPaymentAction(subscriptionRef.id, idToken);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        return;
      }
      window.location.href = result.paymentUrl;
    } catch (error) {
      console.error('handleSubscribePremium: échec', error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de démarrer l'abonnement pour le moment." });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCopyReferralLink = () => {
    if (!user || typeof window === 'undefined') return;
    const link = `${window.location.origin}/login?ref=${user.uid}`;
    navigator.clipboard.writeText(link)
      .then(() => toast({ title: 'Lien copié !', description: 'Partagez-le avec vos proches.' }))
      .catch(() => toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de copier le lien.' }));
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
    <div className="container mx-auto max-w-4xl px-1 sm:px-4">
      <h1 className="text-xl sm:text-3xl font-headline text-primary mb-3 sm:mb-6">Mon Profil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Left Column: Profile Info & Details */}
        <div className="lg:col-span-2 space-y-3.5 sm:space-y-6">
          <Card className="rounded-2xl sm:rounded-3xl">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl">
                <AvatarFallback>{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl">{userProfile?.nom || "Nom non défini"}</CardTitle>
                <CardDescription className="text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </CardDescription>
              </div>
               <Button asChild size="sm" className="rounded-xl text-xs sm:text-sm">
                  <Link href="/profile/edit">
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Modifier
                  </Link>
                </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl sm:rounded-3xl">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Détails du compte</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="flex items-center text-xs sm:text-sm">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
                <span className="font-medium">{userProfile?.telephone || "Non défini"}</span>
              </div>
              <Separator />
              <div className="flex items-start text-xs sm:text-sm">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium">{userProfile?.adresseParDefaut || "Non définie"}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Adresse par défaut</p>
                </div>
              </div>
                 <Separator />
                 <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl text-xs">
                        <LogOut className="mr-1.5 h-3.5 w-3.5" />
                        Se déconnecter
                    </Button>
                 </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats (only for clients) */}
        {activeRole === 'client' && (
            <div className="lg:col-span-1 space-y-3.5 sm:space-y-6">
                <Card className="rounded-2xl sm:rounded-3xl">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                        <CardTitle className="text-base sm:text-lg">Statistiques Client</CardTitle>
                        <CardDescription className="text-xs">Votre activité sur Yakro Fê.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl">
                                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                            </div>
                            <div>
                                <p className="font-bold text-lg sm:text-xl">{stats.orderCount}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Commandes passées</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-green-500/10 rounded-xl">
                                <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600"/>
                            </div>
                            <div>
                                <p className="font-bold text-lg sm:text-xl">{stats.totalSpent} FCFA</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Dépenses totales</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-red-500/10 rounded-xl">
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600"/>
                            </div>
                            <div>
                                <p className="font-bold text-sm sm:text-base truncate max-w-[160px]">{stats.favoriteRestaurant?.nom || 'Indéfini'}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Restaurant favori</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                        <CardTitle className="text-base sm:text-lg">Fidélité &amp; Parrainage</CardTitle>
                        <CardDescription className="text-xs">1000 FCFA commandés = 10 points.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-xl">
                                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600"/>
                            </div>
                            <div>
                                <p className="font-bold text-lg sm:text-xl">{userProfile?.pointsFidelite ?? 0}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Points de fidélité</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                                <Gift className="h-3.5 w-3.5 text-primary" />
                                Invitez vos proches
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                50 points dès leur 1ère commande livrée.
                            </p>
                            <Button variant="outline" size="sm" className="w-full rounded-xl text-xs h-8" onClick={handleCopyReferralLink}>
                                <Copy className="mr-1.5 h-3 w-3" />
                                Copier mon lien
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl sm:rounded-3xl">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                        <CardTitle className="flex items-center gap-1.5 text-base sm:text-lg">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Yakro Premium
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isPremiumActive(userProfile.premiumJusquau)
                                ? `Vos commandes passent en priorité chez le restaurateur et le livreur.`
                                : `Traitement prioritaire : ${PREMIUM_PRICE_FCFA.toLocaleString('fr-FR')} FCFA / ${PREMIUM_DURATION_DAYS}j.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        {isPremiumActive(userProfile.premiumJusquau) ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-xl">
                                    <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-xs sm:text-sm">Actif jusqu&apos;au</p>
                                    <p className="text-xs text-muted-foreground">
                                        {userProfile.premiumJusquau?.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ) : MOBILE_MONEY_ENABLED ? (
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl h-9 text-xs sm:text-sm font-bold" onClick={handleSubscribePremium} disabled={isSubscribing}>
                                {isSubscribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Devenir Premium'}
                            </Button>
                        ) : (
                            <p className="text-[11px] sm:text-xs text-muted-foreground italic">
                                Bientôt disponible avec le paiement Mobile Money.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
}
