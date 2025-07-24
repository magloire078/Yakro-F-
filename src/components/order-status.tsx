'use client';

import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { CheckCircle, CookingPot, Bike, Home } from 'lucide-react';

const statuses = [
  { name: 'Placée', icon: <CheckCircle className="h-8 w-8" /> },
  { name: 'En Préparation', icon: <CookingPot className="h-8 w-8" /> },
  { name: 'En Route', icon: <Bike className="h-8 w-8" /> },
  { name: 'Livrée', icon: <Home className="h-8 w-8" /> },
];

interface OrderStatusProps {
  onNewOrder: () => void;
}

export function OrderStatus({ onNewOrder }: OrderStatusProps) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (statusIndex < statuses.length - 1) {
      const timer = setTimeout(() => {
        setStatusIndex(prevIndex => prevIndex + 1);
      }, 3000); // 3 seconds delay for demo
      return () => clearTimeout(timer);
    }
  }, [statusIndex]);

  const progressValue = ((statusIndex + 1) / statuses.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 flex flex-col items-center text-center">
      <h1 className="text-4xl font-headline text-primary mb-4">Suivi de votre commande</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Nous vous tiendrons au courant de l'avancement de votre commande.
      </p>

      <div className="w-full p-8 border-2 border-primary/20 rounded-xl bg-card shadow-lg">
        <div className="mb-8">
          <Progress value={progressValue} className="h-3 bg-primary/20" />
          <div className="flex justify-between mt-2">
            {statuses.map((status, index) => (
              <div key={status.name} className={`flex flex-col items-center transition-colors duration-500 ${index <= statusIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`p-2 rounded-full transition-colors duration-500 ${index <= statusIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {status.icon}
                </div>
                <span className="text-xs mt-2 font-semibold">{status.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-2xl font-bold font-body animate-pulse">
            {statuses[statusIndex].name}...
        </div>
      </div>
      
      {statusIndex === statuses.length - 1 && (
        <div className="mt-8 flex flex-col items-center gap-4 transition-opacity duration-500 opacity-100">
            <h2 className="text-3xl font-headline text-green-600">Bon appétit !</h2>
            <p className="text-muted-foreground">N'hésitez pas à laisser un avis.</p>
            <Button onClick={onNewOrder} size="lg">Commander à nouveau</Button>
        </div>
      )}
    </div>
  );
}
