
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
import { getPlaceholderImage } from '@/lib/placeholder-images';

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
  const restaurantName = firstRestaurantId ? useData().getRestaurant(firstRestaurantId)?.nom : '';

  const getCartItemPrice = (item: CartItem) => {
      const itemPrice = item.prix;
      const sidePrice = item.accompagnementSelectionne?.prix || 0;
      const drinkPrice = item.boissonSelectionnee?.prix || 0;
      return (itemPrice + sidePrice + drinkPrice) * item.quantite;
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
                    const placeholder = getPlaceholderImage(item.indiceImage);
                    const imageSrc = (item.image && !item.image.includes('picsum.photos'))
                        ? item.image
                        : placeholder.url;
                    return (
                        <div key={`${item.id}-${item.accompagnementSelectionne?.nom}-${item.boissonSelectionnee?.nom}-${index}`} className="flex items-start gap-4">
                            <Image
                            src={imageSrc}
                            alt={item.nom}
                            width={placeholder.width}
                            height={placeholder.height}
                            className="rounded-md object-cover w-16 h-16"
                            data-ai-hint={item.indiceImage}
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{item.nom}</p>
                                <div className="text-xs text-muted-foreground">
                                    {item.accompagnementSelectionne && <p>+ {item.accompagnementSelectionne.nom} ({item.accompagnementSelectionne.prix} F)</p>}
                                    {item.boissonSelectionnee && <p>+ {item.boissonSelectionnee.nom} ({item.boissonSelectionnee.prix} F)</p>}
                                </div>
                                <p className="text-sm font-semibold text-primary mt-1">
                                    {getCartItemPrice(item).toLocaleString('fr-FR')} FCFA
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => updateQuantity(item.id, item.quantite - 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                    >
                                    <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-6 text-center font-medium">{item.quantite}</span>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => updateQuantity(item.id, item.quantite + 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                    >
                                    <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
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
