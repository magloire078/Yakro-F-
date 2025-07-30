
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
import type { MenuItem, MenuOption } from '@/lib/types';
import Image from 'next/image';

interface AddToCartDialogProps {
  item: MenuItem;
  imageSrc: string;
  children: React.ReactNode;
}

export function AddToCartDialog({ item, imageSrc, children }: AddToCartDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedSide, setSelectedSide] = React.useState<MenuOption | undefined>(undefined);
  const [selectedDrink, setSelectedDrink] = React.useState<MenuOption | undefined>(undefined);
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

  const handleSideChange = (value: string) => {
    const side = item.availableSides?.find(s => s.name === value);
    setSelectedSide(side);
  }

  const handleDrinkChange = (value: string) => {
    const drink = item.availableDrinks?.find(d => d.name === value);
    setSelectedDrink(drink);
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
                <RadioGroup value={selectedSide?.name} onValueChange={handleSideChange}>
                  {item.availableSides.map(side => (
                    <div key={side.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={side.name} id={`side-${side.name}`} />
                        <Label htmlFor={`side-${side.name}`}>{side.name}</Label>
                      </div>
                      <span className="text-sm text-muted-foreground">+{side.price.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {item.availableDrinks && item.availableDrinks.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Choisissez une boisson</Label>
                <RadioGroup value={selectedDrink?.name} onValueChange={handleDrinkChange}>
                  {item.availableDrinks.map(drink => (
                    <div key={drink.name} className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value={drink.name} id={`drink-${drink.name}`} />
                        <Label htmlFor={`drink-${drink.name}`}>{drink.name}</Label>
                      </div>
                      <span className="text-sm text-muted-foreground">+{drink.price.toLocaleString('fr-FR')} FCFA</span>
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
