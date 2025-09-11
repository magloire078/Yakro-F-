
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
    item.accompagnementsDisponibles?.[0]
  );
  const [selectedDrink, setSelectedDrink] = React.useState<MenuOption | undefined>(
    item.boissonsDisponibles?.[0]
  );
  const { addToCart } = useCart();
  const { toast } = useToast();

  const resetState = () => {
    setQuantity(1);
    setSelectedSide(item.accompagnementsDisponibles?.[0]);
    setSelectedDrink(item.boissonsDisponibles?.[0]);
  }

  React.useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, item]);

  const handleAddToCart = () => {
    addToCart({
      ...item,
      quantite: quantity,
      image: imageSrc,
      accompagnementSelectionne: selectedSide,
      boissonSelectionnee: selectedDrink,
    });
    toast({
      title: 'Ajouté au panier !',
      description: `${quantity} x ${item.nom} est maintenant dans votre panier.`,
    });
    setIsOpen(false);
  };

  const hasOptions = (item.accompagnementsDisponibles && item.accompagnementsDisponibles.length > 0) || (item.boissonsDisponibles && item.boissonsDisponibles.length > 0);
  
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!hasOptions) {
        e.preventDefault();
        addToCart({
            ...item,
            quantite: 1,
            image: imageSrc,
        });
         toast({
            title: 'Ajouté au panier !',
            description: `${item.nom} est maintenant dans votre panier.`,
        });
    }
  }

  const handleSideChange = (value: string) => {
    const side = item.accompagnementsDisponibles?.find(s => s.nom === value);
    setSelectedSide(side);
  }

  const handleDrinkChange = (value: string) => {
    const drink = item.boissonsDisponibles?.find(d => d.nom === value);
    setSelectedDrink(drink);
  }
  
  const calculateTotalPrice = () => {
    const basePrice = item.prix;
    const sidePrice = selectedSide?.prix || 0;
    const drinkPrice = selectedDrink?.prix || 0;
    return (basePrice + sidePrice + drinkPrice) * quantity;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleTriggerClick}>{children}</DialogTrigger>
      {hasOptions && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4">
                <Image src={imageSrc} alt={item.nom} fill className="object-cover" data-ai-hint={item.indiceImage}/>
            </div>
            <DialogTitle>{item.nom}</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
            <p className="text-lg font-bold text-primary">{item.prix.toLocaleString('fr-FR')} FCFA</p>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[40vh] overflow-y-auto pr-2">
            {item.accompagnementsDisponibles && item.accompagnementsDisponibles.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Choisissez un accompagnement</Label>
                <RadioGroup value={selectedSide?.nom} onValueChange={handleSideChange}>
                  {item.accompagnementsDisponibles.map(side => (
                    <div key={side.nom} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={side.nom} id={`side-${side.nom}`} />
                        <Label htmlFor={`side-${side.nom}`}>{side.nom}</Label>
                      </div>
                      <span className="text-sm text-muted-foreground">+{side.prix.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {item.boissonsDisponibles && item.boissonsDisponibles.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Choisissez une boisson</Label>
                <RadioGroup value={selectedDrink?.nom} onValueChange={handleDrinkChange}>
                  {item.boissonsDisponibles.map(drink => (
                    <div key={drink.nom} className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value={drink.nom} id={`drink-${drink.nom}`} />
                        <Label htmlFor={`drink-${drink.nom}`}>{drink.nom}</Label>
                      </div>
                      <span className="text-sm text-muted-foreground">+{drink.prix.toLocaleString('fr-FR')} FCFA</span>
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
