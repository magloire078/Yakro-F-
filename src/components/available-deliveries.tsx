'use client';

import * as React from 'react';
import type { Order, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Bike, ScanLine, Crown, Wallet, PackageCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QrScannerDialog } from '@/components/qr-scanner-dialog';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { canTransitionOrder } from '@/lib/order-transitions';
import { publishLivreurPublic, unpublishLivreurPublic } from '@/lib/livreur-public';
import { useFirebase } from '@/contexts/firebase-provider';
import { getCurrentLocation } from '@/lib/geolocation';
import { cn } from '@/lib/utils';


interface AvailableDeliveriesProps {
    orders: Order[];
    isLoading: boolean;
    userProfile: UserProfile | null;
    onUpdateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
    onAcceptDelivery: (delivery: Order) => Promise<void>;
    userId?: string;
}

export function AvailableDeliveries({ 
    orders,
    isLoading,
    userProfile,
    onUpdateUserProfile,
    onAcceptDelivery,
    userId
}: AvailableDeliveriesProps) {
    const { toast } = useToast();
    const { db } = useFirebase();
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
    const locationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);

    const isEnService = userProfile?.statutService === 'En service';
    const livreurNom = userProfile?.nom;
    
    const availableDeliveries = React.useMemo(() => {
        if (!isEnService) return [];
        return orders
            .filter(o => canTransitionOrder(o.statut, 'En Route', 'livreur'))
            .sort((a, b) => Number(!!b.prioritaire) - Number(!!a.prioritaire));
    }, [orders, isEnService]);

    const handleAccept = async (delivery: Order) => {
        setIsAccepting(delivery.id);
        try {
            await onAcceptDelivery(delivery);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAccepting(null);
        }
    }
    
    const updateLocation = React.useCallback(async () => {
        if (!userId) return;
        try {
            const { latitude, longitude } = await getCurrentLocation();
            onUpdateUserProfile(userId, { latitude, longitude });
            if (db) {
                publishLivreurPublic(db, userId, {
                    nom: livreurNom,
                    latitude,
                    longitude,
                }).catch((err) => console.error("Public livreur sync failed:", err));
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Loc error:", message);
        }
    }, [userId, onUpdateUserProfile, db, livreurNom]);


    const handleStatusToggle = async (checked: boolean) => {
        if (!userId) return;
        const newStatus = checked ? 'En service' : 'Hors service';
        setIsUpdatingStatus(true);

        if (checked) {
            try {
                const { latitude, longitude } = await getCurrentLocation();
                onUpdateUserProfile(userId, { statutService: newStatus, latitude, longitude });
                if (db) {
                    publishLivreurPublic(db, userId, { nom: livreurNom, latitude, longitude })
                        .catch((err) => console.error("Public livreur sync failed:", err));
                }
                locationIntervalRef.current = setInterval(updateLocation, 10000);
                toast({ title: `Vous êtes en ligne !` });
                setIsUpdatingStatus(false);
            } catch {
                toast({
                    variant: 'destructive',
                    title: 'Position requise',
                    description: "Activez le GPS pour passer en service."
                });
                setIsUpdatingStatus(false);
            }
        } else {
             if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
                locationIntervalRef.current = null;
            }
            await onUpdateUserProfile(userId, { statutService: newStatus });
            if (db) {
                unpublishLivreurPublic(db, userId)
                    .catch((err) => console.error("Public livreur cleanup failed:", err));
            }
            toast({ title: `Déconnecté.` });
            setIsUpdatingStatus(false);
        }
    }

    const handleScanSuccess = async (orderId: string) => {
        setIsScannerOpen(false);
        if (!userId) return;

        setIsAccepting(orderId);
        try {
            await updateOrderStatusAction({
                orderId,
                status: 'En Route',
                delivererId: userId,
            });
            toast({
                title: "Commande scannée !",
                description: "Validation réussie, bonne route !",
            });
        } catch (err) {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'QR Code invalide',
                description: "Cette commande n'a pas pu être validée ou n'existe pas.",
            });
        } finally {
            setIsAccepting(null);
        }
    };
    
    React.useEffect(() => {
        return () => {
            if(locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        }
    }, [])


    const todayStats = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const delivered = orders.filter(o => o.livreurId === userId && o.statut === 'Livrée' && o.date?.startsWith(today));
        const earnings = delivered.reduce((acc, o) => acc + (o.fraisDeLivraison || 0), 0);
        return { count: delivered.length, earnings };
    }, [orders, userId]);

    return (
        <div className="container mx-auto pb-20 px-2 sm:px-4 max-w-4xl">
            {/* Liseré subtil tricolore */}
            <div className="flex h-1 w-28 rounded-full overflow-hidden mb-3 opacity-80">
                <div className="flex-1 bg-orange-500" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-emerald-500" />
            </div>

            {/* Titre & Statut */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-headline font-black text-foreground">
                        Espace <span className="text-primary italic">Livreur</span>
                    </h1>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
                        {livreurNom ? `Connecté en tant que ${livreurNom}` : 'Supervision des courses'}
                    </p>
                </div>
            </div>

            {/* Mini stats du jour - 2 cartes par ligne */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3.5 mb-3 sm:mb-5">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-500">
                        <Wallet className="h-3.5 w-3.5" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground">Gains du Jour</span>
                    </div>
                    <p className="text-base sm:text-2xl font-headline font-black text-emerald-500">
                        {todayStats.earnings.toLocaleString('fr-FR')} <span className="text-[9px] sm:text-xs font-normal text-muted-foreground">FCFA</span>
                    </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1 text-orange-500">
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground">Livrées Aujourd&apos;hui</span>
                    </div>
                    <p className="text-base sm:text-2xl font-headline font-black text-foreground">
                        {todayStats.count} <span className="text-[9px] sm:text-xs font-normal text-muted-foreground">courses</span>
                    </p>
                </div>
            </div>

            {/* Barre de Contrôle En Service / Hors Service & Scanner */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/70 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-xl shadow-sm mb-4 sm:mb-6">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", isEnService ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" : "bg-slate-400")} />
                        <Label htmlFor="service-status" className="font-headline font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer">
                            {isEnService ? "En Service (GPS Actif)" : "Hors Service"}
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch id="service-status" checked={isEnService} onCheckedChange={handleStatusToggle} disabled={isUpdatingStatus}/>
                        {isUpdatingStatus && <Loader className="animate-spin h-3.5 w-3.5 text-primary" />}
                    </div>
                </div>

                {isEnService && (
                    <Button 
                        variant="default" 
                        size="default" 
                        className="h-11 sm:h-12 px-4 bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
                        onClick={() => setIsScannerOpen(true)}
                    >
                        <ScanLine className="mr-2 h-4 w-4" />
                        Scanner QR Bastion
                    </Button>
                )}
            </div>

            <div className="space-y-3 sm:space-y-4">
                {isLoading && isEnService && (
                    <div className="flex justify-center p-8"><Loader className="animate-spin h-8 w-8 text-primary" /></div>
                )}
                
                {isEnService && !isLoading && availableDeliveries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {availableDeliveries.map(delivery => (
                            <Card key={delivery.id} className="overflow-hidden rounded-xl sm:rounded-2xl border border-border dark:border-white/10 bg-card/70 dark:bg-white/5 backdrop-blur-xl shadow-md hover:border-primary/50 transition-all duration-300">
                                <CardContent className="p-3.5 sm:p-4.5 space-y-3">
                                   <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-headline font-black text-sm sm:text-base text-foreground leading-tight truncate">{delivery.nomRestaurant}</p>
                                                {delivery.prioritaire && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-orange-500/20 shrink-0">
                                                        <Crown className="h-2.5 w-2.5 text-orange-500" /> Prioritaire
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                Commande #{delivery.id.slice(0,5)} &bull; {delivery.plats.reduce((acc, i) => acc + i.quantite, 0)} article(s)
                                            </p>
                                        </div>
                                        <Badge className="text-xs sm:text-sm font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                                            +{delivery.fraisDeLivraison.toLocaleString('fr-FR')} F
                                        </Badge>
                                   </div>

                                   <div className="space-y-2 py-2 border-y border-dashed border-border/80 text-xs">
                                        <div className="flex gap-2.5 items-start">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] uppercase font-bold text-muted-foreground">1. Récupération (Bastion)</p>
                                                <p className="text-xs font-semibold text-foreground truncate">{delivery.adresseRestaurant}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] uppercase font-bold text-muted-foreground">2. Destination (Client)</p>
                                                <p className="text-xs font-semibold text-foreground truncate">{delivery.adresseClient}</p>
                                            </div>
                                        </div>
                                   </div>

                                   <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                                        {delivery.paiement.mode === 'especes' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 font-bold text-[9px] sm:text-[10px] border border-orange-500/20">
                                                💵 Espèces à encaisser : {delivery.total.toLocaleString('fr-FR')} F
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[9px] sm:text-[10px] border border-emerald-500/20">
                                                ✅ Réglé Mobile Money
                                            </span>
                                        )}
                                   </div>

                                   <Button
                                     onClick={() => handleAccept(delivery)}
                                     disabled={isAccepting !== null || !canTransitionOrder(delivery.statut, 'En Route', 'livreur')}
                                     className="w-full h-11 text-xs sm:text-sm font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all hover:scale-[1.01]"
                                   >
                                     {isAccepting === delivery.id ? <Loader className="animate-spin h-4 w-4" /> : "Prendre la course"}
                                   </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                 {isEnService && !isLoading && availableDeliveries.length === 0 && (
                    <div className="text-center py-8 sm:py-14 px-4 sm:px-6 bg-card/60 dark:bg-white/5 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-3">
                        <div className="bg-primary/10 p-3 sm:p-4 rounded-full">
                            <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-primary"/>
                        </div>
                        <p className="text-base sm:text-lg font-headline font-black text-foreground">Zone calme...</p>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[260px]">
                            Aucune course prête à proximité. Restez en ligne, de nouvelles commandes arrivent constamment !
                        </p>
                    </div>
                )}

                {!isEnService && !isUpdatingStatus && (
                    <div className="text-center py-8 sm:py-14 px-4 sm:px-6 bg-card/60 dark:bg-white/5 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-3">
                        <div className="bg-muted p-3 sm:p-4 rounded-full">
                            <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground"/>
                        </div>
                        <p className="text-base sm:text-lg font-headline font-black text-foreground">Hors ligne</p>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[260px]">
                            Activez le bouton « En service » ci-dessus pour recevoir des propositions de courses.
                        </p>
                    </div>
                )}
            </div>

            <QrScannerDialog
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
}
