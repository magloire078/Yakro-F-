
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem } from '@/lib/types';
import Image from 'next/image';

interface AddToCartDialogProps {
  item: MenuItem;
  imageSrc: string;
  children: React.ReactNode;
}

export function AddToCartDialog({ item, imageSrc, children }: AddToCartDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedSide, setSelectedSide] = React.useState<string | undefined>(undefined);
  const [selectedDrink, setSelectedDrink] = React.useState<string | undefined>(undefined);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart({
      ...item,
      quantity: 1,
      image: imageSrc,
      selectedSide,
      selectedDrink,
    });
    toast({
      title: 'Ajouté au panier !',
      description: `${item.name} est maintenant dans votre panier.`,
    });
    setIsOpen(false);
    // Reset selections
    setSelectedSide(undefined);
    setSelectedDrink(undefined);
  };

  const hasOptions = (item.availableSides && item.availableSides.length > 0) || (item.availableDrinks && item.availableDrinks.length > 0);
  
  // If no options, add directly to cart
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!hasOptions) {
        e.preventDefault();
        addToCart({
            ...item,
            quantity: 1,
            image: imageSrc,
        });
         toast({
            title: 'Ajouté au panier !',
            description: `${item.name} est maintenant dans votre panier.`,
        });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleTriggerClick}>{children}</DialogTrigger>
      {hasOptions && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
                <div className="flex items-center gap-4">
                     <Image src={imageSrc} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                     <div>
                        <p>{item.name}</p>
                        <p className="text-sm font-normal text-muted-foreground">{item.price.toLocaleString('fr-FR')} FCFA</p>
                     </div>
                </div>
            </DialogTitle>
            <DialogDescription>Personnalisez votre commande.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {item.availableSides && item.availableSides.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Choisissez un accompagnement</Label>
                <RadioGroup value={selectedSide} onValueChange={setSelectedSide}>
                  {item.availableSides.map(side => (
                    <div key={side} className="flex items-center space-x-2">
                      <RadioGroupItem value={side} id={`side-${side}`} />
                      <Label htmlFor={`side-${side}`}>{side}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {item.availableDrinks && item.availableDrinks.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Choisissez une boisson</Label>
                <RadioGroup value={selectedDrink} onValueChange={setSelectedDrink}>
                  {item.availableDrinks.map(drink => (
                    <div key={drink} className="flex items-center space-x-2">
                      <RadioGroupItem value={drink} id={`drink-${drink}`} />
                      <Label htmlFor={`drink-${drink}`}>{drink}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAddToCart}>Ajouter au panier</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
