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
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2, Tag, X } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { type CartItem, type PaymentMode } from '@/lib/types';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMethodSelector } from './payment-method-selector';
import { Input } from './ui/input';


export function CartSheet({ children }: { children: React.ReactNode }) {
  const {
    cartItems, removeFromCart, updateQuantity, cartSubtotal, cartDeliveryFee, cartTotal, cartCount,
    appliedCoupon, cartDiscount, applyCoupon, removeCoupon, placeOrder, clearCart,
  } = useCart();
  const { getRestaurant } = useData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [checkoutStep, setCheckoutStep] = React.useState<'cart' | 'payment'>('cart');
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('especes');
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const result = await applyCoupon(couponInput);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Code promo', description: result.error });
        return;
      }
      setCouponInput('');
      toast({ title: 'Code promo appliqué !' });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

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
        <SheetHeader className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
               {checkoutStep === 'payment' ? (
                 <button
                   onClick={() => setCheckoutStep('cart')}
                   className="p-1.5 sm:p-2 bg-primary/10 rounded-xl text-primary hover:bg-primary/20 transition-colors"
                   aria-label="Retour au panier"
                 >
                   <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                 </button>
               ) : (
                 <div className="p-1.5 sm:p-2 bg-primary/10 rounded-xl">
                    <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                 </div>
               )}
               <div>
                  <SheetTitle className="text-lg sm:text-xl font-headline">
                    {checkoutStep === 'payment' ? 'Mode de paiement' : 'Mon Panier'}
                  </SheetTitle>
                  {checkoutStep === 'cart' && (
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">{cartCount} article{cartCount > 1 ? 's' : ''}</p>
                  )}
               </div>
            </div>
            {checkoutStep === 'cart' && cartItems.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 h-7 px-2"
                    onClick={() => clearCart()}
                >
                    Vider
                </Button>
            )}
          </div>
          {checkoutStep === 'cart' && restaurantName && (
             <div className="mt-2.5 sm:mt-4 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
               <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Commande chez <span className="font-bold text-slate-900 dark:text-white">{restaurantName}</span></p>
             </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {checkoutStep === 'payment' ? (
            <ScrollArea className="h-full px-4 sm:px-6">
              <div className="py-4 sm:py-8 space-y-5 sm:space-y-8">
                <PaymentMethodSelector value={paymentMode} onChange={setPaymentMode} />

                <div className="space-y-2">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Code promo</p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                        <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {appliedCoupon.code}
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Retirer le code promo"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: YAKRO10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="rounded-xl h-10 text-xs sm:text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="rounded-xl shrink-0 h-10 text-xs sm:text-sm"
                      >
                        {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Appliquer'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : cartItems.length > 0 ? (
            <ScrollArea className="h-full px-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:gap-4 py-4 sm:py-6">
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
                        className="group relative flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                      >
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl">
                          {isCloudinary ? (
                            <CldImage
                              src={imageSrc}
                              alt={item.nom}
                              width={70}
                              height={70}
                              crop="fill"
                              gravity="auto"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={imageSrc}
                              alt={item.nom}
                              width={70}
                              height={70}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col min-w-0">
                          <div className="flex justify-between items-start gap-1">
                             <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug truncate">{item.nom}</h4>
                             <button 
                                onClick={() => removeFromCart(item.id, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                                title="Supprimer l&apos;article"
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </button>
                          </div>
                          
                          <div className="mt-0.5 space-y-0.5">
                            {item.accompagnementSelectionne && (
                                <p className="text-[9px] sm:text-[10px] text-slate-400 italic leading-none">+ {item.accompagnementSelectionne.nom}</p>
                            )}
                            {item.boissonSelectionnee && (
                                <p className="text-[9px] sm:text-[10px] text-slate-400 italic leading-none">+ {item.boissonSelectionnee.nom}</p>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-100 dark:border-slate-700">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded hover:bg-white dark:hover:bg-slate-700"
                                onClick={() => updateQuantity(item.id, item.quantite - 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </Button>
                              <span className="w-5 text-center text-xs font-bold">{item.quantite}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded hover:bg-white dark:hover:bg-slate-700"
                                onClick={() => updateQuantity(item.id, item.quantite + 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                            <span className="font-black text-primary text-xs sm:text-sm">
                              {getCartItemPrice(item).toLocaleString('fr-FR')} <small className="font-normal text-[9px]">F</small>
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
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-headline text-slate-900 dark:text-white">Votre panier est vide</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                On dirait bien que vous n&apos;avez pas encore succombé à la tentation !
              </p>
              <SheetClose asChild>
                <Button className="mt-5 rounded-xl px-6 h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90">
                    Découvrir les menus
                </Button>
              </SheetClose>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col w-full gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-bold text-slate-900 dark:text-white">{cartSubtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Livraison</span>
                  <span className="font-bold text-emerald-500">{cartDeliveryFee === 0 ? 'Gratuit' : `${cartDeliveryFee.toLocaleString('fr-FR')} FCFA`}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500">Réduction ({appliedCoupon?.code})</span>
                    <span className="font-bold text-primary">-{cartDiscount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <Separator className="bg-slate-100 dark:bg-slate-800" />
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Total</span>
                    <p className="text-xl sm:text-2xl font-headline text-slate-900 dark:text-white">
                        {(cartTotal - cartDiscount).toLocaleString('fr-FR')} <small className="text-xs font-bold">F</small>
                    </p>
                  </div>
                  {checkoutStep === 'cart' ? (
                    <Button
                        size="sm"
                        className="rounded-xl sm:rounded-2xl h-11 sm:h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold group text-xs sm:text-sm"
                        onClick={() => setCheckoutStep('payment')}
                    >
                        Valider <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button
                        size="sm"
                        className="rounded-xl sm:rounded-2xl h-11 sm:h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold group text-xs sm:text-sm"
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                    >
                        {isPlacingOrder ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Confirmer <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></>
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
