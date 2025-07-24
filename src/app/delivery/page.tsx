
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, MapPin, Package, Clock, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for deliveries
const availableDeliveries = [
    {
        id: 'del1',
        restaurantName: 'Le Pili Pili',
        restaurantAddress: 'Rue des Jardins, Cocody',
        customerAddress: 'Angré 7ème Tranche',
        status: 'En attente',
        estimatedTime: 15,
        earnings: 1200,
    },
    {
        id: 'del2',
        restaurantName: 'Chez Mario',
        restaurantAddress: 'Boulevard de Marseille, Zone 4',
        customerAddress: 'Plateau, Cité Administrative',
        status: 'En attente',
        estimatedTime: 20,
        earnings: 1500,
    },
];

const ActiveDelivery = {
    id: 'del3',
    restaurantName: 'Le Bazin',
    restaurantAddress: 'II Plateaux Vallon',
    customerAddress: 'Riviera Palmeraie',
    status: 'En cours',
    items: ['Foutou Banane', 'Alloco'],
    customerPhone: '07 01 02 03 04',
};


export default function DeliveryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [currentDelivery, setCurrentDelivery] = React.useState<any>(null);

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleAcceptDelivery = (delivery: any) => {
        // In a real app, this would update the backend
        setCurrentDelivery(ActiveDelivery);
    };

    const handleCompleteDelivery = () => {
        // In a real app, this would update the backend
        setCurrentDelivery(null);
    }

    if (authLoading || !user) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    if (currentDelivery) {
        return (
            <div className="container mx-auto">
                <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Livraison en cours</h1>
                <Card className="bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <span>Commande pour {currentDelivery.customerAddress}</span>
                           <Badge variant="default">En cours</Badge>
                        </CardTitle>
                        <CardDescription>Du restaurant : {currentDelivery.restaurantName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <MapPin className="text-primary"/>
                                <div>
                                    <p className="font-semibold">Récupérer à</p>
                                    <p>{currentDelivery.restaurantAddress}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <MapPin className="text-green-500"/>
                                <div>
                                    <p className="font-semibold">Livrer à</p>
                                    <p>{currentDelivery.customerAddress}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4 space-y-2">
                             <div className="flex items-center gap-4">
                                <Package className="text-muted-foreground"/>
                                <p>Contenu: {currentDelivery.items.join(', ')}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Phone className="text-muted-foreground"/>
                                <p>Client: {currentDelivery.customerPhone}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button className="w-full" size="lg" onClick={handleCompleteDelivery}>Marquer comme livré</Button>
                            <Button variant="outline" className="w-full" size="lg">Problème ?</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8">Courses disponibles</h1>
            <div className="space-y-4">
                {availableDeliveries.map(delivery => (
                    <Card key={delivery.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           <div className="flex-1">
                             <p className="font-bold">{delivery.restaurantName}</p>
                             <p className="text-sm text-muted-foreground">À livrer à <span className="font-medium text-foreground">{delivery.customerAddress}</span></p>
                           </div>
                           <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4"/>
                                    <span>{delivery.estimatedTime} min</span>
                                </div>
                                <Badge variant="secondary" className="text-base">{delivery.earnings.toLocaleString('fr-FR')} FCFA</Badge>
                           </div>
                           <Button onClick={() => handleAcceptDelivery(delivery)}>Accepter</Button>
                        </CardContent>
                    </Card>
                ))}
                 {availableDeliveries.length === 0 && !currentDelivery && (
                    <p className="text-muted-foreground text-center py-8">Aucune course disponible pour le moment.</p>
                )}
            </div>
        </div>
    );
}
