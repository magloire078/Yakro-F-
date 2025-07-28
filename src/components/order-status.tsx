
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { CheckCircle, CookingPot, Bike, Home, Loader } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import type { Order } from '@/lib/types';

const statusConfig = {
  'Placée': { name: 'Placée', icon: <CheckCircle className="h-10 w-10" />, description: "Le restaurant a bien reçu votre commande." },
  'En Préparation': { name: 'En Préparation', icon: <CookingPot className="h-10 w-10" />, description: "Le restaurant prépare votre repas avec soin." },
  'En Route': { name: 'En Route', icon: <Bike className="h-10 w-10" />, description: "Votre livreur est en chemin pour vous régaler." },
  'Livrée': { name: 'Livrée', icon: <Home className="h-10 w-10" />, description: "Bon appétit ! Votre commande est arrivée." },
  'Annulée': { name: 'Annulée', icon: <Home className="h-10 w-10" />, description: "Votre commande a été annulée." },
};

interface OrderStatusProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderStatus({ order, onNewOrder }: OrderStatusProps) {
  const currentStatus = statusConfig[order.status];
  const isFinished = order.status === 'Livrée';
  const allStatuses = Object.values(statusConfig).filter(s => s.name !== 'Annulée');
  const statusIndex = allStatuses.findIndex(s => s.name === order.status);


  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center text-center h-full">
      <div className="w-full p-8 border-2 border-primary/20 rounded-xl bg-card shadow-2xl flex flex-col items-center">
        <div className={`mb-6 p-4 rounded-full transition-colors duration-500 text-primary ${!isFinished ? 'animate-pulse' : ''}`}>
          {currentStatus.icon}
        </div>
        <h1 className="text-5xl font-headline text-primary mb-2">{currentStatus.name}</h1>
        <p className="text-lg text-muted-foreground mb-12 h-6">
          {currentStatus.description}
        </p>

        <div className="w-full max-w-md">
           <div className="relative w-full h-1 bg-muted rounded-full">
              <div 
                className="absolute top-0 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                style={{width: `${(statusIndex / (allStatuses.length - 1)) * 100}%`}}
              ></div>
           </div>
           <div className="flex justify-between mt-3">
            {allStatuses.map((status, index) => (
              <div key={status.name} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${index <= statusIndex ? 'bg-primary' : 'bg-muted'}`}></div>
                <span className={`text-xs mt-2 font-semibold transition-colors duration-500 ${index <= statusIndex ? 'text-primary' : 'text-muted-foreground'}`}>{status.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {isFinished && (
        <div className="mt-10 flex flex-col items-center gap-4 transition-opacity duration-1000 opacity-100">
            <h2 className="text-3xl font-headline text-green-600">Bon appétit !</h2>
            <p className="text-muted-foreground">Votre commande a été livrée avec succès.</p>
            <Button onClick={onNewOrder} size="lg" className="mt-4">Commander à nouveau</Button>
        </div>
      )}
    </div>
  );
}
