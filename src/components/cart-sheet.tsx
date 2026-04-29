
'use client';

import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/cart-context';
import { ScrollArea } from './ui/scroll-area';
import { Minus, Plus, Trash2, Tag, X, Clock, CreditCard, Wallet, Smartphone, Sparkles } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { type CartItem, type PaymentMethod } from '@/lib/types';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import {
  formatScheduledDate,
  maxScheduledDate,
  minScheduledDate,
  toLocalInputValue,
  validateScheduledDate,
} from '@/lib/scheduled-orders';
import { PAYMENT_METHODS, getPaymentMethod } from '@/lib/payment';
import { cn } from '@/lib/utils';
import { useLoyalty } from '@/hooks/use-loyalty';
import { TIERS } from '@/lib/loyalty';

const paymentIconFor = (id: PaymentMethod) => {
  switch (id) {
    case 'especes':
      return Wallet;
    case 'carte':
      return CreditCard;
    default:
      return Smartphone;
  }
};

export function CartSheet({ children }: { children: React.ReactNode }) {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartDeliveryFee,
    cartDiscount,
    cartLoyaltyDiscount,
    cartTotal,
    cartCount,
    placeOrder,
    promoCode,
    applyPromo,
    removePromo,
    scheduledFor,
    setScheduledFor,
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
  } = useCart();
  const { tier } = useLoyalty();
  const { getMenuItem } = useData();
  const { toast } = useToast();
  const [promoInput, setPromoInput] = React.useState('');
  const [scheduleMode, setScheduleMode] = React.useState<'now' | 'later'>(scheduledFor ? 'later' : 'now');
  const [scheduleInput, setScheduleInput] = React.useState<string>(() =>
    scheduledFor ? toLocalInputValue(new Date(scheduledFor)) : toLocalInputValue(minScheduledDate())
  );

  React.useEffect(() => {
    if (scheduleMode === 'now') {
      setScheduledFor(null);
      return;
    }
    if (!scheduleInput) return;
    const iso = new Date(scheduleInput).toISOString();
    const result = validateScheduledDate(iso);
    if (result.ok) {
      setScheduledFor(iso);
    } else {
      setScheduledFor(null);
    }
  }, [scheduleMode, scheduleInput, setScheduledFor]);

  const scheduleError = React.useMemo(() => {
    if (scheduleMode !== 'later' || !scheduleInput) return null;
    const iso = new Date(scheduleInput).toISOString();
    const result = validateScheduledDate(iso);
    return result.ok ? null : result.error;
  }, [scheduleMode, scheduleInput]);

  const handleApplyPromo = () => {
    const result = applyPromo(promoInput);
    if (result.ok) {
      toast({ title: 'Code promo appliqué', description: 'La réduction a été ajoutée.' });
      setPromoInput('');
    } else {
      toast({ variant: 'destructive', title: 'Code invalide', description: result.error });
    }
  };

  const handlePlaceOrder = async () => {
    if (scheduleMode === 'later' && scheduleError) {
        toast({ variant: 'destructive', title: 'Date invalide', description: scheduleError });
        return;
    }
    try {
        await placeOrder();
        toast({
            title: 'Commande passée !',
            description: scheduledFor
              ? `Programmée pour ${formatScheduledDate(scheduledFor)}.`
              : 'Votre commande a été envoyée au restaurant.',
        });
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
                                    className="h-6 w-6"
                                    onClick={() => updateQuantity(item.id, item.quantite - 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                    >
                                    <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center">{item.quantite}</span>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateQuantity(item.id, item.quantite + 1, item.accompagnementSelectionne?.nom, item.boissonSelectionnee?.nom)}
                                    >
                                    <Plus className="h-3 w-3" />
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
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Quand voulez-vous être livré ?
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={scheduleMode === 'now' ? 'default' : 'outline'}
                      onClick={() => setScheduleMode('now')}
                      className="flex-1"
                    >
                      Maintenant
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={scheduleMode === 'later' ? 'default' : 'outline'}
                      onClick={() => setScheduleMode('later')}
                      className="flex-1"
                    >
                      Programmer
                    </Button>
                  </div>
                  {scheduleMode === 'later' && (
                    <div className="space-y-1">
                      <Input
                        type="datetime-local"
                        value={scheduleInput}
                        min={toLocalInputValue(minScheduledDate())}
                        max={toLocalInputValue(maxScheduledDate())}
                        onChange={e => setScheduleInput(e.target.value)}
                      />
                      {scheduleError ? (
                        <p className="text-xs text-destructive">{scheduleError}</p>
                      ) : scheduledFor ? (
                        <p className="text-xs text-muted-foreground">Livraison prévue : {formatScheduledDate(scheduledFor)}</p>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    Mode de paiement
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(m => {
                      const Icon = paymentIconFor(m.id);
                      const selected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted'
                          )}
                          aria-pressed={selected}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{m.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{getPaymentMethod(paymentMethod).description}</p>
                  {(getPaymentMethod(paymentMethod).needsPhone || getPaymentMethod(paymentMethod).needsCard) && (
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder={
                        getPaymentMethod(paymentMethod).needsPhone
                          ? 'Numéro Mobile Money (ex: 07 12 34 56 78)'
                          : '4 derniers chiffres de la carte'
                      }
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                    />
                  )}
                </div>

                {tier !== 'Bronze' && cartLoyaltyDiscount > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 p-2 text-xs text-yellow-800 dark:text-yellow-200">
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Avantage {tier} : {tier === 'Or' ? 'livraison offerte' : `−${cartLoyaltyDiscount.toLocaleString('fr-FR')} FCFA sur la livraison`}.
                    </span>
                  </div>
                )}

                {promoCode ? (
                  <div className="flex items-center justify-between rounded-md bg-green-50 dark:bg-green-950 p-2 text-sm">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Tag className="h-4 w-4" />
                      <span className="font-semibold">{promoCode.code.code}</span>
                      <span className="text-xs text-muted-foreground">{promoCode.code.description}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removePromo} aria-label="Retirer le code promo">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Code promo"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      className="flex-1"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleApplyPromo} disabled={!promoInput.trim()}>
                      Appliquer
                    </Button>
                  </div>
                )}
                 <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{cartSubtotal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Frais de livraison</span>
                        <span className={promoCode?.fraisLivraisonOffert ? 'line-through text-muted-foreground' : ''}>
                          {cartDeliveryFee.toLocaleString('fr-FR')} FCFA
                        </span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-green-700 dark:text-green-400">
                          <span>Réduction</span>
                          <span>−{cartDiscount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}
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
