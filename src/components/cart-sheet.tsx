'use client';

import * as React from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
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
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { type CartItem, type PaymentMode } from '@/lib/types';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMethodSelector } from './payment-method-selector';


export function CartSheet({ children }: { children: React.ReactNode }) {
  const { cartItems, removeFromCart, updateQuantity, cartSubtotal, cartDeliveryFee, cartTotal, cartCount, placeOrder, clearCart } = useCart();
  const { getRestaurant } = useData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [checkoutStep, setCheckoutStep] = React.useState<'cart' | 'payment'>('cart');
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('especes');
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCheckoutStep('cart');
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const result = await placeOrder(paymentMode);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.error?.message || 'Impossible de passer la commande pour le moment.',
        });
        return;
      }
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Commande passée, paiement à réessayer',
          description: result.error.message || 'Le paiement Mobile Money n\'a pas pu être initié. Réessayez depuis le suivi de commande.',
        });
      } else {
        toast({
          title: 'Commande passée !',
          description: 'Votre commande a été envoyée au restaurant.',
        });
      }
      setIsOpen(false);
      setCheckoutStep('cart');
    } catch (e: unknown) {
      const error = e as Error;
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de passer la commande pour le moment.',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const firstRestaurantId = cartItems.length > 0 ? cartItems[0].restaurantId : null;
  const restaurant = firstRestaurantId ? getRestaurant(firstRestaurantId) : null;
  const restaurantName = restaurant?.nom || '';

  const getCartItemPrice = (item: CartItem) => {
    const itemPrice = item.prix;
    const sidePrice = item.accompagnementSelectionne?.prix || 0;
    const drinkPrice = item.boissonSelectionnee?.prix || 0;
    return (itemPrice + sidePrice + drinkPrice) * item.quantite;
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               {checkoutStep === 'payment' ? (
                 <button
                   onClick={() => setCheckoutStep('cart')}
                   className="p-2 bg-primary/10 rounded-xl text-primary hover:bg-primary/20 transition-colors"
                   aria-label="Retour au panier"
                 >
                   <ArrowLeft className="h-6 w-6" />
                 </button>
               ) : (
                 <div className="p-2 bg-primary/10 rounded-xl">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                 </div>
               )}
               <div>
                  <SheetTitle className="text-xl font-headline">
                    {checkoutStep === 'payment' ? 'Mode de paiement' : 'Mon Panier'}
                  </SheetTitle>
                  {checkoutStep === 'cart' && (
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{cartCount} article{cartCount > 1 ? 's' : ''}</p>
                  )}
               </div>
            </div>
            {checkoutStep === 'cart' && cartItems.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500"
                    onClick={() => clearCart()}
                >
                    Vider
                </Button>
            )}
          </div>
          {checkoutStep === 'cart' && restaurantName && (
             <div className="mt-4 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
               <p className="text-xs text-slate-500 dark:text-slate-400">Commande groupée chez <span className="font-bold text-slate-900 dark:text-white">{restaurantName}</span></p>
             </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {checkoutStep === 'payment' ? (
            <ScrollArea className="h-full px-6">
              <div className="py-8">
                <PaymentMethodSelector value={paymentMode} onChange={setPaymentMode} />
              </div>
            </ScrollArea>
          ) : cartItems.length > 0 ? (
            <ScrollArea className="h-full px-6">
              <div className="flex flex-col gap-6 py-8">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, index) => {
                    const placeholder = getPlaceholderImage(item.indiceImage);
                    const imageSrc = (item.image && !item.image.includes('picsum.photos'))
                      ? item.image
                      : placeholder.url;
                    const isCloudinary = imageSrc.includes('res.cloudinary.com');
                    
                    return (
                      <motion.div 
                        key={`${item.id}-${item.accompagnementSelectionne?.nom}-${item.boissonSelectionnee?.nom}-${index}`}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group relative flex items-start gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                          {isCloudinary ? (
                            <CldImage
                              src={imageSrc}
                              alt={item.nom}
                              width={80}
                              height={80}
                              crop="fill"
                              gravity="auto"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={imageSrc}
                              alt={item.nom}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col pt-1">
                          <div className="flex justify-between gap-2">
                             <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.nom}</h4>
                             <button 
                                onClick={() => removeFromCart(item.id, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                title="Supprimer l&apos;article"
                             >
                               <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                          
                          <div className="mt-1 space-y-0.5">
                            {item.accompagnementSelectionne && (
                                <p className="text-[10px] text-slate-400 italic leading-none">+ {item.accompagnementSelectionne.nom}</p>
                            )}
                            {item.boissonSelectionnee && (
                                <p className="text-[10px] text-slate-400 italic leading-none">+ {item.boissonSelectionnee.nom}</p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                                onClick={() => updateQuantity(item.id, item.quantite - 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-xs font-bold">{item.quantite}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                                onClick={() => updateQuantity(item.id, item.quantite + 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-bold text-primary text-sm">
                              {getCartItemPrice(item).toLocaleString('fr-FR')} <small className="font-normal text-[10px]">F</small>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-xl font-headline text-slate-900 dark:text-white">Votre panier est vide</p>
              <p className="text-sm text-slate-400 mt-2 max-w-[200px]">
                On dirait bien que vous n&apos;avez pas encore succombé à la tentation !
              </p>
              <SheetClose asChild>
                <Button className="mt-8 rounded-2xl px-8 bg-primary hover:bg-primary/90">
                    Découvrir les menus
                </Button>
              </SheetClose>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col w-full gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-bold text-slate-900 dark:text-white">{cartSubtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Livraison</span>
                  <span className="font-bold text-emerald-500">{cartDeliveryFee === 0 ? 'Gratuit' : `${cartDeliveryFee.toLocaleString('fr-FR')} FCFA`}</span>
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total à payer</span>
                    <p className="text-3xl font-headline text-slate-900 dark:text-white">
                        {cartTotal.toLocaleString('fr-FR')} <small className="text-sm font-bold">FCFA</small>
                    </p>
                  </div>
                  {checkoutStep === 'cart' ? (
                    <Button
                        size="lg"
                        className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold group"
                        onClick={() => setCheckoutStep('payment')}
                    >
                        Valider <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button
                        size="lg"
                        className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold group"
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                    >
                        {isPlacingOrder ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Confirmer <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
