
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
import { Minus, Plus } from 'lucide-react';

interface AddToCartDialogProps {
  item: MenuItem;
  imageSrc: string;
  children: React.ReactNode;
}

export function AddToCartDialog({ item, imageSrc, children }: AddToCartDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedSide, setSelectedSide] = React.useState<MenuOption | undefined>(
    item.availableSides?.[0]
  );
  const [selectedDrink, setSelectedDrink] = React.useState<MenuOption | undefined>(
    item.availableDrinks?.[0]
  );
  const { addToCart } = useCart();
  const { toast } = useToast();

  const resetState = () => {
    setQuantity(1);
    setSelectedSide(item.availableSides?.[0]);
    setSelectedDrink(item.availableDrinks?.[0]);
  }

  React.useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, item]);

  const handleAddToCart = () => {
    addToCart({
      ...item,
      quantity,
      image: imageSrc,
      selectedSide,
      selectedDrink,
    });
    toast({
      title: 'Ajouté au panier !',
      description: `${quantity} x ${item.name} est maintenant dans votre panier.`,
    });
    setIsOpen(false);
  };

  const hasOptions = (item.availableSides && item.availableSides.length > 0) || (item.availableDrinks && item.availableDrinks.length > 0);
  
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
  
  const calculateTotalPrice = () => {
    const basePrice = item.price;
    const sidePrice = selectedSide?.price || 0;
    const drinkPrice = selectedDrink?.price || 0;
    return (basePrice + sidePrice + drinkPrice) * quantity;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleTriggerClick}>{children}</DialogTrigger>
      {hasOptions && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4">
                <Image src={imageSrc} alt={item.name} fill className="object-cover" data-ai-hint={item.imageHint}/>
            </div>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
            <p className="text-lg font-bold text-primary">{item.price.toLocaleString('fr-FR')} FCFA</p>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[40vh] overflow-y-auto pr-2">
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
          <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus /></Button>
              <span className="text-lg font-bold w-10 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => q+1)}><Plus /></Button>
            </div>
            <Button onClick={handleAddToCart} className="w-full sm:w-auto">
              Ajouter - {calculateTotalPrice().toLocaleString('fr-FR')} FCFA
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
