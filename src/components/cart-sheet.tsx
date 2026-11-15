'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/cart-context';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { type CartItem, type PaymentMode } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMethodSelector } from './payment-method-selector';
import { FoodImage } from '@/components/food-image';
import { Stepper } from '@/components/mobile-ui';
import { formatFcfa } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  LockKeyhole,
  MapPin,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

/**
 * Panier latéral (client).
 *
 * Refonte visuelle « Yakro Elite · Nuit & Braise » : en-tête éditorial
 * Fraunces, lignes en cartes chaudes avec `Stepper`, récapitulatif et CTA
 * collés en bas. Toute la logique du contexte panier (quantités, options,
 * code promo, paiement) est inchangée.
 */
export function CartSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
          title: 'Commande validée !',
          description: 'Votre commande a été envoyée au restaurant avec succès.',
        });
      }
      setIsOpen(false);
      setCheckoutStep('cart');
      if (result.orderId) {
        router.push(`/orders/track?id=${result.orderId}`);
      }
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
  const montantAPayer = cartTotal - cartDiscount;

  const getCartItemPrice = (item: CartItem) => {
    const itemPrice = item.prix;
    const sidePrice = item.accompagnementSelectionne?.prix || 0;
    const drinkPrice = item.boissonSelectionnee?.prix || 0;
    return (itemPrice + sidePrice + drinkPrice) * item.quantite;
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-hidden border-l border-black/[0.08] bg-[#FAF7F2] p-0 text-[#16130F] dark:border-white/[0.08] dark:bg-[#0A0A0B] dark:text-[#FAFAF9] sm:max-w-md">
        <SheetHeader className="shrink-0 space-y-0 px-5 pb-3 pt-4 text-left">
          <div className="flex items-center justify-between gap-3 pr-10">
            {checkoutStep === 'payment' ? (
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#16130F] shadow-sm transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
                aria-label="Retour au panier"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
            ) : (
              <span className="yk-label">
                {cartCount} article{cartCount > 1 ? 's' : ''}
              </span>
            )}
            {checkoutStep === 'cart' && cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => clearCart()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#8A8078] shadow-sm transition-colors hover:text-red-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60 dark:hover:text-red-400"
                aria-label="Vider le panier"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          <SheetTitle asChild>
            <h1 className="yk-display mt-2 text-[32px] leading-none">
              {checkoutStep === 'payment' ? (
                <>
                  Votre <span className="yk-italic text-[#C2410C] dark:text-orange-400">paiement</span>
                </>
              ) : (
                <>
                  Votre <span className="yk-italic text-[#C2410C] dark:text-orange-400">panier</span>
                </>
              )}
            </h1>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {checkoutStep === 'payment'
              ? 'Choisissez un moyen de paiement puis confirmez votre commande.'
              : 'Vérifiez les articles de votre panier avant de valider.'}
          </SheetDescription>

          {checkoutStep === 'cart' && restaurantName && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-semibold text-[#6B625A] dark:text-white/55">
                <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
                <span className="truncate">{restaurantName}</span>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex min-h-[40px] shrink-0 items-center px-1 text-[11.5px] font-bold text-[#C2410C] dark:text-orange-400"
                  aria-label="Modifier le restaurant"
                >
                  Modifier
                </button>
              </SheetClose>
            </div>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {checkoutStep === 'payment' ? (
            <div className="space-y-5 pb-4 pt-2">
              <PaymentMethodSelector value={paymentMode} onChange={setPaymentMode} />

              <div>
                <p className="yk-label mb-2 px-1">Code promo</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-[1.1rem] border border-orange-500/25 bg-orange-500/[0.06] px-3.5 py-2">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#C2410C] dark:text-orange-400">
                      <Tag className="h-4 w-4" />
                      {appliedCoupon.code}
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[#8A8078] transition-colors hover:text-red-500 dark:text-white/45 dark:hover:text-red-400"
                      aria-label="Retirer le code promo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-[1.1rem] border border-black/[0.06] bg-white p-1.5 pl-3.5 dark:border-white/10 dark:bg-[#141416]">
                    <Tag className="h-4 w-4 shrink-0 text-orange-500" />
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Ex: YAKRO10"
                      aria-label="Code promo"
                      className="h-11 w-full min-w-0 bg-transparent text-[13px] font-semibold text-[#16130F] outline-none placeholder:font-medium placeholder:text-[#A79E96] dark:text-white dark:placeholder:text-white/35"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="flex h-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#16130F] px-3.5 text-[11.5px] font-bold text-white transition-opacity disabled:opacity-50 dark:bg-white dark:text-[#16130F]"
                      aria-label="Appliquer le code promo"
                    >
                      {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : cartItems.length > 0 ? (
            <div className="space-y-3 pb-4 pt-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {cartItems.map((item) => (
                  <motion.article
                    key={`${item.id}-${item.accompagnementSelectionne?.nom}-${item.boissonSelectionnee?.nom}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="yk-card flex gap-3.5 p-3"
                  >
                    <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[1.05rem]">
                      <FoodImage src={item.image} alt={item.nom} kind="plat" sizes="76px" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="yk-display truncate text-[15.5px] leading-tight">{item.nom}</h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                          className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#C9C0B6] transition-colors hover:text-red-500 dark:text-white/30 dark:hover:text-red-400"
                          aria-label={`Supprimer ${item.nom}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {(item.accompagnementSelectionne || item.boissonSelectionnee) && (
                        <p className="mt-0.5 truncate text-[11px] text-[#8A8078] dark:text-white/45">
                          {[item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="yk-display text-[15.5px] text-[#C2410C] dark:text-orange-400">
                          {formatFcfa(getCartItemPrice(item))}
                        </span>
                        <Stepper
                          valeur={item.quantite}
                          onChange={(valeur) =>
                            updateQuantity(item.id, valeur, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)
                          }
                        />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              <SheetClose asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-[1.2rem] border border-dashed border-black/15 py-3 text-[12.5px] font-bold text-[#6B625A] transition-colors hover:border-orange-500/40 hover:text-orange-600 dark:border-white/15 dark:text-white/60 dark:hover:text-orange-400"
                >
                  <Plus className="h-4 w-4 text-orange-500" />
                  Ajouter un plat
                </button>
              </SheetClose>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                <ShoppingBag className="h-7 w-7 text-[#C9C0B6] dark:text-white/30" />
              </div>
              <p className="yk-display mt-4 text-[22px] leading-tight">Votre panier est vide</p>
              <p className="mt-1 max-w-[220px] text-[12px] text-[#8A8078] dark:text-white/45">
                On dirait bien que vous n&apos;avez pas encore succombé à la tentation !
              </p>
              <SheetClose asChild>
                <button type="button" className="yk-cta mt-5 px-6 text-[13.5px]">
                  Découvrir les menus
                </button>
              </SheetClose>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="shrink-0 flex-col gap-3 border-t border-black/[0.06] bg-white/95 px-5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0B0B0D]/95">
            <div className="space-y-1.5 text-[12.5px]">
              <div className="flex justify-between text-[#6B625A] dark:text-white/55">
                <span>
                  Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})
                </span>
                <span className="font-semibold tabular-nums">{formatFcfa(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6B625A] dark:text-white/55">
                <span>Livraison</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {cartDeliveryFee === 0 ? 'Gratuit' : formatFcfa(cartDeliveryFee)}
                </span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#6B625A] dark:text-white/55">
                  <span>Réduction ({appliedCoupon?.code})</span>
                  <span className="font-semibold tabular-nums text-[#C2410C] dark:text-orange-400">
                    -{formatFcfa(cartDiscount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-black/[0.06] pt-2 dark:border-white/[0.08]">
                <span className="text-[15px] font-bold">Total</span>
                <span className="yk-display text-[19px] text-[#C2410C] dark:text-orange-400">
                  {formatFcfa(montantAPayer)}
                </span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button type="button" onClick={() => setCheckoutStep('payment')} className="yk-cta w-full justify-between px-5">
                <span className="flex items-center gap-2 text-[14px]">
                  <LockKeyhole className="h-4 w-4" /> Valider {formatFcfa(montantAPayer)}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="yk-cta w-full justify-between px-5 disabled:opacity-70"
                aria-label="Confirmer la commande"
              >
                <span className="flex items-center gap-2 text-[14px]">
                  {isPlacingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  {isPlacingOrder ? 'Envoi en cours…' : `Confirmer ${formatFcfa(montantAPayer)}`}
                </span>
                {!isPlacingOrder && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
