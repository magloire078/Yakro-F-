
'use client';

import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { CheckCircle, CookingPot, Bike, Home } from 'lucide-react';

const statuses = [
  { name: 'Placée', icon: <CheckCircle className="h-10 w-10" />, description: "Votre commande a été reçue, nous la préparons." },
  { name: 'En Préparation', icon: <CookingPot className="h-10 w-10" />, description: "Le restaurant prépare votre repas avec soin." },
  { name: 'En Route', icon: <Bike className="h-10 w-10" />, description: "Votre livreur est en chemin pour vous régaler." },
  { name: 'Livrée', icon: <Home className="h-10 w-10" />, description: "Bon appétit ! Votre commande est arrivée." },
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
  const currentStatus = statuses[statusIndex];
  const isFinished = statusIndex === statuses.length - 1;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center text-center h-full">
      <div className="w-full p-8 border-2 border-primary/20 rounded-xl bg-card shadow-2xl flex flex-col items-center">
        <div className={`mb-6 p-4 rounded-full transition-colors duration-500 text-primary animate-pulse`}>
          {currentStatus.icon}
        </div>
        <h1 className="text-5xl font-headline text-primary mb-2">{currentStatus.name}</h1>
        <p className="text-lg text-muted-foreground mb-12 h-6">
          {currentStatus.description}
        </p>

        <div className="w-full max-w-md">
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between mt-3">
            {statuses.map((status, index) => (
              <div key={status.name} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${index <= statusIndex ? 'bg-primary' : 'bg-muted'}`}></div>
                <span className={`text-xs mt-2 font-semibold transition-colors duration-500 ${index <= statusIndex ? 'text-primary' : 'text-muted-foreground'}`}>{status.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {isFinished && (
        <div className="mt-10 flex flex-col items-center gap-4 transition-opacity duration-1000 opacity-100 animate-fade-in">
            <h2 className="text-3xl font-headline text-green-600">Bon appétit !</h2>
            <p className="text-muted-foreground">Votre commande a été livrée avec succès.</p>
            <Button onClick={onNewOrder} size="lg" className="mt-4">Commander à nouveau</Button>
        </div>
      )}
    </div>
  );
}
