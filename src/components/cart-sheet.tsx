
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
import { useImages } from '@/contexts/image-context';

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { getMenuItemImage } = useImages();

  const handlePlaceOrder = () => {
    // This is a simulation. In a real app, this would trigger the checkout flow.
    const placeOrderTrigger = document.getElementById('placeOrderTrigger');
    if (placeOrderTrigger) {
      placeOrderTrigger.click();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Panier ({cartCount})</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={getMenuItemImage(item.id)}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                      data-ai-hint={item.imageHint}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="mt-4">
              <div className="flex flex-col w-full gap-4">
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
