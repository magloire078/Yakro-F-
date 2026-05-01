'use client';

import * as React from 'react';
import type { Order, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Bike, ScanLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QrScannerDialog } from '@/components/qr-scanner-dialog';
import { updateOrderStatusAction } from '@/app/actions/order-actions';


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
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
    const locationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);

    const isEnService = userProfile?.statutService === 'En service';
    
    const availableDeliveries = React.useMemo(() => {
        if (!isEnService) return [];
        return orders.filter(o => o.statut === 'En Préparation');
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
    
    const updateLocation = React.useCallback(() => {
        if (!userId || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onUpdateUserProfile(userId, { latitude, longitude });
            },
            (error) => {
                console.error("Loc error:", error.message);
            }
        );
    }, [userId, onUpdateUserProfile]);


    const handleStatusToggle = async (checked: boolean) => {
        if (!userId) return;
        const newStatus = checked ? 'En service' : 'Hors service';
        setIsUpdatingStatus(true);

        if (checked) {
            if (!navigator.geolocation) {
                toast({ variant: 'destructive', title: 'GPS non supporté' });
                setIsUpdatingStatus(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    onUpdateUserProfile(userId, { statutService: newStatus, latitude, longitude });
                    locationIntervalRef.current = setInterval(updateLocation, 10000);
                    toast({ title: `Vous êtes en ligne !` });
                    setIsUpdatingStatus(false);
                },
                () => {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Position requise', 
                        description: "Activez le GPS pour passer en service." 
                    });
                    setIsUpdatingStatus(false);
                }
            );
        } else {
             if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
                locationIntervalRef.current = null;
            }
            await onUpdateUserProfile(userId, { statutService: newStatus });
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
        <div className="container mx-auto pb-20">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-headline text-primary">Courses</h1>
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border shadow-sm">
                        <Label htmlFor="service-status" className="text-sm font-semibold">
                            {isEnService ? 'En ligne' : 'Hors ligne'}
                        </Label>
                        <Switch id="service-status" checked={isEnService} onCheckedChange={handleStatusToggle} disabled={isUpdatingStatus}/>
                        {isUpdatingStatus && <Loader className="animate-spin h-4 w-4 text-primary" />}
                    </div>
                </div>

                {isEnService && (
                    <Button variant="default" size="lg" className="w-full btn-mobile shadow-lg" onClick={() => setIsScannerOpen(true)}>
                        <ScanLine className="mr-2" />
                        Scanner pour récupérer
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {isLoading && isEnService && (
                    <div className="flex justify-center p-12"><Loader className="animate-spin h-10 w-10 text-primary" /></div>
                )}
                
                {isEnService && !isLoading && availableDeliveries.length > 0 && availableDeliveries.map(delivery => (
                    <Card key={delivery.id} className="overflow-hidden rounded-xl hover:shadow-md transition-soft">
                        <CardContent className="p-4 space-y-4">
                           <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-bold text-lg leading-tight">{delivery.nomRestaurant}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
                                        Commande n°{delivery.id.slice(0,5)}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="text-lg font-bold text-primary">
                                    {delivery.fraisDeLivraison.toLocaleString('fr-FR')} F
                                </Badge>
                           </div>

                           <div className="space-y-2 py-2 border-y border-dashed">
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <div className="w-0.5 h-full bg-muted" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Départ</p>
                                        <p className="text-sm font-medium">{delivery.adresseRestaurant}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Arrivée</p>
                                        <p className="text-sm font-medium">{delivery.adresseClient}</p>
                                    </div>
                                </div>
                           </div>

                           <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {delivery.plats.reduce((acc, i) => acc + i.quantite, 0)} article(s)
                                </span>
                               <Button onClick={() => handleAccept(delivery)} disabled={isAccepting !== null} size="sm">
                                 {isAccepting === delivery.id ? <Loader className="animate-spin h-4 w-4" /> : "Prendre la course"}
                               </Button>
                           </div>
                        </CardContent>
                    </Card>
                ))}

                 {isEnService && !isLoading && availableDeliveries.length === 0 && (
                    <div className="text-center py-16 px-6 bg-card rounded-2xl border-2 border-dashed flex flex-col items-center gap-4">
                        <div className="bg-muted p-4 rounded-full">
                            <Bike className="w-12 h-12 text-muted-foreground"/>
                        </div>
                        <p className="text-lg font-bold">Zone calme...</p>
                        <p className="text-sm text-muted-foreground max-w-[200px]">
                            Aucune commande prête à proximité. Restez en ligne pour être alerté.
                        </p>
                    </div>
                )}

                {!isEnService && !isUpdatingStatus && (
                    <div className="text-center py-16 px-6 bg-primary/5 rounded-2xl border-2 border-primary/20 flex flex-col items-center gap-4">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <Bike className="w-12 h-12 text-primary"/>
                        </div>
                        <p className="text-xl font-bold text-primary">Hors ligne</p>
                        <p className="text-sm text-muted-foreground max-w-[250px]">
                            Passez en service pour commencer à gagner de l&apos;argent et recevoir des courses.
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
