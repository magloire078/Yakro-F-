'use client';

import * as React from 'react';
import type { Order, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Bike, ScanLine, Crown } from 'lucide-react';
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


    return (
        <div className="container mx-auto pb-16 px-1 sm:px-4">
            <div className="flex flex-col gap-3 sm:gap-6 mb-4 sm:mb-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">Courses</h1>
                    <div className="flex items-center gap-2 sm:gap-3 bg-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border shadow-sm">
                        <Label htmlFor="service-status" className="text-xs sm:text-sm font-semibold">
                            {isEnService ? 'En ligne' : 'Hors ligne'}
                        </Label>
                        <Switch id="service-status" checked={isEnService} onCheckedChange={handleStatusToggle} disabled={isUpdatingStatus}/>
                        {isUpdatingStatus && <Loader className="animate-spin h-4 w-4 text-primary" />}
                    </div>
                </div>

                {isEnService && (
                    <Button variant="default" size="default" className="w-full btn-mobile shadow-lg h-11 text-sm font-bold" onClick={() => setIsScannerOpen(true)}>
                        <ScanLine className="mr-2 h-4 w-4" />
                        Scanner pour récupérer
                    </Button>
                )}
            </div>

            <div className="space-y-3 sm:space-y-4">
                {isLoading && isEnService && (
                    <div className="flex justify-center p-8"><Loader className="animate-spin h-8 w-8 text-primary" /></div>
                )}
                
                {isEnService && !isLoading && availableDeliveries.length > 0 && availableDeliveries.map(delivery => (
                    <Card key={delivery.id} className="overflow-hidden rounded-2xl hover:shadow-md transition-soft">
                        <CardContent className="p-3.5 sm:p-4 space-y-3 sm:space-y-4">
                           <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-base sm:text-lg leading-tight">{delivery.nomRestaurant}</p>
                                        {delivery.prioritaire && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                                                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Prioritaire
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 italic">
                                        Commande n°{delivery.id.slice(0,5)}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="text-sm sm:text-base font-bold text-primary px-2 py-0.5">
                                    {delivery.fraisDeLivraison.toLocaleString('fr-FR')} F
                                </Badge>
                           </div>

                           <div className="space-y-1.5 py-2 border-y border-dashed">
                                <div className="flex gap-2.5 items-center">
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-muted-foreground">Départ</p>
                                        <p className="text-xs sm:text-sm font-medium truncate">{delivery.adresseRestaurant}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 items-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-muted-foreground">Arrivée</p>
                                        <p className="text-xs sm:text-sm font-medium truncate">{delivery.adresseClient}</p>
                                    </div>
                                </div>
                           </div>

                           <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-muted-foreground">
                                    {delivery.plats.reduce((acc, i) => acc + i.quantite, 0)} article(s)
                                </span>
                                {delivery.paiement.mode === 'especes' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 font-bold text-[10px]">
                                        À encaisser : {delivery.total.toLocaleString('fr-FR')} FCFA
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
                                        {delivery.paiement.statut === 'paye' ? 'Déjà payé (MoMo)' : 'Paiement MoMo en attente'}
                                    </span>
                                )}
                           </div>

                           <div className="flex items-center justify-end pt-1">
                               <Button
                                 onClick={() => handleAccept(delivery)}
                                 disabled={isAccepting !== null || !canTransitionOrder(delivery.statut, 'En Route', 'livreur')}
                                 size="sm"
                                 className="h-8 text-xs font-bold"
                               >
                                 {isAccepting === delivery.id ? <Loader className="animate-spin h-3.5 w-3.5" /> : "Prendre la course"}
                               </Button>
                           </div>
                        </CardContent>
                    </Card>
                ))}

                 {isEnService && !isLoading && availableDeliveries.length === 0 && (
                    <div className="text-center py-8 sm:py-14 px-4 sm:px-6 bg-card rounded-2xl border-2 border-dashed flex flex-col items-center gap-3">
                        <div className="bg-muted p-3 sm:p-4 rounded-full">
                            <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground"/>
                        </div>
                        <p className="text-base sm:text-lg font-bold">Zone calme...</p>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[220px]">
                            Aucune commande prête à proximité. Restez en ligne pour être alerté.
                        </p>
                    </div>
                )}

                {!isEnService && !isUpdatingStatus && (
                    <div className="text-center py-8 sm:py-14 px-4 sm:px-6 bg-primary/5 rounded-2xl border-2 border-primary/20 flex flex-col items-center gap-3">
                        <div className="bg-primary/10 p-3 sm:p-4 rounded-full">
                            <Bike className="w-8 h-8 sm:w-10 sm:h-10 text-primary"/>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-primary">Hors ligne</p>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-[250px]">
                            Passez en service pour commencer à recevoir des courses.
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
