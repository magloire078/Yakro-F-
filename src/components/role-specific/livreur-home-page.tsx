

'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, Phone, Bike, Home, ChefHat, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/data-context';
import { type Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';


export default function LivreurHomePage() {
    const { user, userProfile, updateUserProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { orders, isLoading, updateOrderStatus } = useData();
    const [currentDelivery, setCurrentDelivery] = React.useState<Order | null>(null);
    const { toast } = useToast();
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [isCompleting, setIsCompleting] = React.useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
    const locationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const isEnService = userProfile?.statutService === 'En service';
    
    const availableDeliveries = React.useMemo(() => {
        if (!isEnService) return [];
        return orders.filter(o => o.statut === 'En Préparation');
    }, [orders, isEnService]);
    
    // Check if the current user has an active delivery
    React.useEffect(() => {
        if (user) {
            const activeOrder = orders.find(o => o.livreurId === user.uid && o.statut === 'En Route');
            setCurrentDelivery(activeOrder || null);
        }
    }, [orders, user]);

    const handleAcceptDelivery = async (delivery: Order) => {
        if (!user) return;
        setIsAccepting(delivery.id);
        try {
            await updateOrderStatus(delivery.id, 'En Route', user.uid);
            setCurrentDelivery({ ...delivery, statut: 'En Route', livreurId: user.uid });
            toast({
                title: "Course acceptée !",
                description: `Vous allez livrer la commande de ${delivery.nomRestaurant}.`,
            });
        } catch(error) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'accepter cette course pour le moment.",
            });
        } finally {
            setIsAccepting(null);
        }
    };

    const handleCompleteDelivery = async () => {
        if (!currentDelivery) return;
        setIsCompleting(true);
        try {
            await updateOrderStatus(currentDelivery.id, 'Livrée');
            setCurrentDelivery(null);
            toast({
                title: "Livraison terminée !",
                description: `Bien joué !`,
            });
        } catch(error) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de marquer cette course comme livrée.",
            });
        } finally {
            setIsCompleting(false);
        }
    }
    
    const updateLocation = React.useCallback(() => {
        if (!user || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                updateUserProfile(user.uid, { latitude, longitude });
            },
            (error) => {
                console.error("Erreur de géolocalisation: ", error.message);
                // Optionnel: informer l'utilisateur que la localisation a échoué
            }
        );
    }, [user, updateUserProfile]);


    const handleStatusToggle = async (checked: boolean) => {
        if (!user) return;
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
                    updateUserProfile(user.uid, { statutService: newStatus, latitude, longitude });
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
            await updateUserProfile(user.uid, { statutService: newStatus });
            toast({ title: `Vous êtes maintenant hors service.` });
            setIsUpdatingStatus(false);
        }
    }

    const getGoogleMapsLink = (order: Order) => {
        if (!order.latitudeRestaurant || !order.longitudeRestaurant || !order.latitudeClient || !order.longitudeClient) {
            return null;
        }
        return `https://www.google.com/maps/dir/?api=1&origin=${order.latitudeRestaurant},${order.longitudeRestaurant}&destination=${order.latitudeClient},${order.longitudeClient}&travelmode=driving`;
    }
    
    React.useEffect(() => {
        return () => {
            if(locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        }
    }, [])

    if (currentDelivery) {
        const mapsLink = getGoogleMapsLink(currentDelivery);
        return (
            <div className="container mx-auto">
                <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Livraison en cours</h1>
                <Card className="bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <span>Commande n°{currentDelivery.id.slice(0, 5)}...</span>
                           <Badge variant="default">En cours</Badge>
                        </CardTitle>
                        <CardDescription>Récupérez et livrez la commande suivante.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 border-b pb-4">
                            <div className="flex items-start gap-4">
                                <ChefHat className="text-primary mt-1"/>
                                <div>
                                    <p className="font-semibold text-lg">1. Récupérer chez {currentDelivery.nomRestaurant}</p>
                                    <p className="text-muted-foreground">{currentDelivery.adresseRestaurant}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-4">
                                <Home className="text-green-500 mt-1"/>
                                <div>
                                    <p className="font-semibold text-lg">2. Livrer à</p>
                                    <p className="text-muted-foreground">{currentDelivery.adresseClient}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {mapsLink && (
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={mapsLink} target="_blank" rel="noopener noreferrer">
                                        <Map className="mr-2"/>
                                        Voir sur la carte
                                    </Link>
                                </Button>
                            )}
                             <div className="flex items-center gap-4">
                                <p>Contenu : {currentDelivery.plats.map(i => `${i.quantite}x ${i.nom}`).join(', ')}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Phone className="text-muted-foreground"/>
                                <p>Client : {currentDelivery.telephoneClient}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                            <Button className="w-full" size="lg" onClick={handleCompleteDelivery} disabled={isCompleting}>
                                {isCompleting && <Loader className="animate-spin mr-2" />}
                                Marquer comme livré
                            </Button>
                            <Button variant="outline" className="w-full" size="lg">Signaler un problème</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                 <h1 className="text-3xl md:text-4xl font-headline text-primary">Courses disponibles</h1>
                 <Card className="p-3">
                     <div className="flex items-center space-x-2">
                        <Switch id="service-status" checked={isEnService} onCheckedChange={handleStatusToggle} disabled={isUpdatingStatus}/>
                        <Label htmlFor="service-status" className="text-lg">{isEnService ? 'En service' : 'Hors service'}</Label>
                        {isUpdatingStatus && <Loader className="animate-spin text-primary" />}
                    </div>
                 </Card>
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
                               <Button onClick={() => handleAcceptDelivery(delivery)} disabled={isAccepting !== null} size="lg">
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
    );
}
