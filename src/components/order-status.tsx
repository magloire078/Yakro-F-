

'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { CheckCircle, CookingPot, Bike, Home, Loader, Map } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import type { Order } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const statusConfig = {
  'Placée': { name: 'Placée', icon: <CheckCircle className="h-8 w-8" />, description: "Le restaurant a bien reçu votre commande." },
  'En Préparation': { name: 'En Préparation', icon: <CookingPot className="h-8 w-8" />, description: "Le restaurant prépare votre repas." },
  'En Route': { name: 'En Route', icon: <Bike className="h-8 w-8" />, description: "Votre livreur est en chemin." },
  'Livrée': { name: 'Livrée', icon: <Home className="h-8 w-8" />, description: "Bon appétit ! Votre commande est arrivée." },
  'Annulée': { name: 'Annulée', icon: <Home className="h-8 w-8" />, description: "Votre commande a été annulée." },
};

interface OrderStatusProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderStatus({ order, onNewOrder }: OrderStatusProps) {
  const currentStatus = statusConfig[order.statut];
  const isFinished = order.statut === 'Livrée' || order.statut === 'Annulée';
  const allStatuses = Object.values(statusConfig).filter(s => s.name !== 'Annulée');
  const statusIndex = allStatuses.findIndex(s => s.name === order.statut);

  useEffect(() => {
      if(isFinished) {
          const timer = setTimeout(() => {
              onNewOrder();
          }, 5000); // Wait 5 seconds before clearing the status
          return () => clearTimeout(timer);
      }
  }, [isFinished, onNewOrder]);


  return (
    <section>
        <Card className="w-full bg-primary/5 border-primary/20 shadow-lg">
            <CardHeader className="text-center">
                 <h2 className="text-2xl font-headline text-primary">Suivi de votre commande</h2>
                 <p className="text-muted-foreground">Votre commande de <span className="font-semibold text-foreground">{order.nomRestaurant}</span></p>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <div className={`mb-4 p-3 rounded-full transition-colors duration-500 text-primary ${!isFinished ? 'animate-pulse' : ''}`}>
                    {currentStatus.icon}
                </div>
                <h3 className="text-2xl font-bold">{currentStatus.name}</h3>
                <p className="text-muted-foreground mb-8 h-10">
                    {currentStatus.description}
                    {order.statut === 'En Route' && (
                        <Button asChild variant="link" className="text-primary">
                            <Link href={`/orders/${order.id}/track`}>
                                Suivre le livreur
                                <Map className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    )}
                </p>

                <div className="w-full max-w-lg">
                   <div className="relative w-full h-1 bg-muted rounded-full">
                      <div 
                        className="absolute top-0 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                        style={{width: `${(statusIndex / (allStatuses.length - 1)) * 100}%`}}
                      ></div>
                   </div>
                   <div className="flex justify-between mt-3">
                    {allStatuses.map((status, index) => (
                      <div key={status.name} className="flex flex-col items-center w-20">
                        <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${index <= statusIndex ? 'bg-primary' : 'bg-muted'}`}></div>
                        <span className={`text-xs mt-2 font-semibold transition-colors duration-500 text-center ${index <= statusIndex ? 'text-primary' : 'text-muted-foreground'}`}>{status.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                 {isFinished && (
                    <div className="mt-8 text-center">
                        <p className="text-green-600 font-bold">Votre commande a été livrée !</p>
                        <p className="text-sm text-muted-foreground">Ce message disparaîtra dans quelques secondes.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </section>
  );
}
