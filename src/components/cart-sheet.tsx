
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/cart-context';
import { ScrollArea } from './ui/scroll-area';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { type CartItem } from '@/lib/types';

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { cartItems, removeFromCart, updateQuantity, cartSubtotal, cartDeliveryFee, cartTotal, cartCount, placeOrder, clearCart } = useCart();
  const { getMenuItem } = useData();
  const { toast } = useToast();

  const handlePlaceOrder = async () => {
    try {
        await placeOrder();
        toast({
            title: 'Commande passée !',
            description: 'Votre commande a été envoyée au restaurant.',
        });
        // Sheet will be closed by the SheetClose component
    } catch(e: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: e.message || 'Impossible de passer la commande pour le moment.',
        });
    }
  };

  // Check if all items are from the same restaurant
  const firstRestaurantId = cartItems.length > 0 ? cartItems[0].restaurantId : null;
  const restaurantName = firstRestaurantId ? useData().getRestaurant(firstRestaurantId)?.name : '';

  const getCartItemPrice = (item: CartItem) => {
      const itemPrice = item.price;
      const sidePrice = item.selectedSide?.price || 0;
      const drinkPrice = item.selectedDrink?.price || 0;
      return (itemPrice + sidePrice + drinkPrice) * item.quantity;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Panier ({cartCount})</SheetTitle>
          {restaurantName && <p className="text-sm text-muted-foreground">Commande chez {restaurantName}</p>}
        </SheetHeader>
        <Separator />
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map((item, index) => {
                    return (
                        <div key={`${item.id}-${item.selectedSide?.name}-${item.selectedDrink?.name}-${index}`} className="flex items-start gap-4">
                            <Image
                            src={item.image || `https://placehold.co/100x100.png`}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                            data-ai-hint={item.imageHint}
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{item.name}</p>
                                <div className="text-xs text-muted-foreground">
                                    {item.selectedSide && <p>+ {item.selectedSide.name} ({item.selectedSide.price} F)</p>}
                                    {item.selectedDrink && <p>+ {item.selectedDrink.name} ({item.selectedDrink.price} F)</p>}
                                </div>
                                <p className="text-sm font-semibold text-primary mt-1">
                                    {getCartItemPrice(item).toLocaleString('fr-FR')} FCFA
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSide?.name, item.selectedDrink?.name)}
                                    >
                                    <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSide?.name, item.selectedDrink?.name)}
                                    >
                                    <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id, item.selectedSide?.name, item.selectedDrink?.name)}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                })}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="mt-4">
              <div className="flex flex-col w-full gap-4">
                 <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{cartSubtotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Frais de livraison</span>
                        <span>{cartDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                 </div>
                 <Separator />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                <SheetClose asChild>
                  <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePlaceOrder}>
                    Passer la commande
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold">Votre panier est vide</p>
            <p className="text-muted-foreground mt-2">
              Ajoutez des plats de vos restaurants préférés.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
