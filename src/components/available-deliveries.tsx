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
        await onAcceptDelivery(delivery);
        setIsAccepting(null);
    }
    
    const updateLocation = React.useCallback(() => {
        if (!userId || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onUpdateUserProfile(userId, { latitude, longitude });
            },
            (error) => {
                console.error("Erreur de géolocalisation: ", error.message);
            }
        );
    }, [userId, onUpdateUserProfile]);


    const handleStatusToggle = async (checked: boolean) => {
        if (!userId) return;
        const newStatus = checked ? 'En service' : 'Hors service';
        setIsUpdatingStatus(true);

        if (checked) {
            if (!navigator.geolocation) {
                toast({ variant: 'destructive', title: 'Géolocalisation non supportée' });
                setIsUpdatingStatus(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    onUpdateUserProfile(userId, { statutService: newStatus, latitude, longitude });
                    locationIntervalRef.current = setInterval(updateLocation, 10000); // Mettre à jour toutes les 10s
                    toast({ title: `Vous êtes maintenant en service.` });
                    setIsUpdatingStatus(false);
                },
                (error) => {
                    toast({ variant: 'destructive', title: 'Accès à la localisation refusé', description: "Veuillez autoriser la géolocalisation pour passer en service." });
                    setIsUpdatingStatus(false);
                }
            );
        } else {
             if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
                locationIntervalRef.current = null;
            }
            await onUpdateUserProfile(userId, { statutService: newStatus });
            toast({ title: `Vous êtes maintenant hors service.` });
            setIsUpdatingStatus(false);
        }
    }

    const handleScanSuccess = (orderId: string) => {
        setIsScannerOpen(false);
        const orderToAccept = availableDeliveries.find(o => o.id === orderId);
        if (orderToAccept) {
            handleAccept(orderToAccept);
        } else {
            toast({
                variant: 'destructive',
                title: 'Commande inconnue',
                description: "Ce QR code ne correspond à aucune commande prête à être récupérée.",
            });
        }
    };
    
    React.useEffect(() => {
        return () => {
            if(locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        }
    }, [])


    return (
        <>
            <div className="container mx-auto">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                     <h1 className="text-3xl md:text-4xl font-headline text-primary">Courses disponibles</h1>
                     <div className="flex items-center gap-2">
                        {isEnService && (
                            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                                <ScanLine />
                                Scanner une commande
                            </Button>
                        )}
                        <Card className="p-3">
                             <div className="flex items-center space-x-2">
                                <Switch id="service-status" checked={isEnService} onCheckedChange={handleStatusToggle} disabled={isUpdatingStatus}/>
                                <Label htmlFor="service-status" className="text-lg">{isEnService ? 'En service' : 'Hors service'}</Label>
                                {isUpdatingStatus && <Loader className="animate-spin text-primary" />}
                            </div>
                        </Card>
                    </div>
                </div>
                <div className="space-y-4">
                    {isLoading && isEnService && (
                        <div className="flex justify-center items-center p-8"><Loader className="animate-spin text-primary" /></div>
                    )}
                    
                    {isEnService && !isLoading && availableDeliveries.length > 0 && availableDeliveries.map(delivery => (
                        <Card key={delivery.id}>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                               <div className="md:col-span-1">
                                 <p className="font-bold text-lg">{delivery.nomRestaurant}</p>
                                 <p className="text-sm text-muted-foreground">De: {delivery.adresseRestaurant}</p>
                                 <p className="text-sm text-muted-foreground">À: {delivery.adresseClient}</p>
                               </div>
                               <div className="md:col-span-1 flex flex-row md:flex-col items-start md:items-center justify-between gap-2 text-sm">
                                    <Badge variant="secondary" className="text-base font-bold">{delivery.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</Badge>
                                    <div className="flex items-center gap-2">
                                        <span>{delivery.plats.reduce((acc, i) => acc + i.quantite, 0)} article(s)</span>
                                    </div>
                               </div>
                               <div className="md:col-span-1 flex justify-start md:justify-end">
                                   <Button onClick={() => handleAccept(delivery)} disabled={isAccepting !== null} size="lg">
                                     {isAccepting === delivery.id && <Loader className="animate-spin mr-2"/>}
                                     Accepter la course
                                   </Button>
                               </div>
                            </CardContent>
                        </Card>
                    ))}

                     {isEnService && !isLoading && availableDeliveries.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4 bg-card rounded-lg">
                            <Bike className="w-16 h-16"/>
                            <p className="text-lg font-medium">Aucune course disponible pour le moment</p>
                            <p>Les commandes prêtes à être livrées apparaîtront ici.</p>
                        </div>
                    )}

                    {!isEnService && (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4 bg-card rounded-lg">
                            <Bike className="w-16 h-16"/>
                            <p className="text-lg font-medium">Vous êtes hors service.</p>
                            <p>Activez votre statut pour commencer à recevoir des propositions de courses.</p>
                        </div>
                    )}
                </div>
            </div>
            <QrScannerDialog
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </>
    );
}
