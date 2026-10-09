
'use client';

import * as React from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { doc, getDoc } from 'firebase/firestore';
import { Star, Crown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Order, Review } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { OrderReviewDialog } from './order-review-dialog';

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { getMenuItem } = useData();
  const { db } = useFirebase();
  const [existingReview, setExistingReview] = React.useState<Review | null | undefined>(undefined);

  React.useEffect(() => {
    if (order.statut !== 'Livrée') return;
    let cancelled = false;
    getDoc(doc(db, 'avis', order.id)).then((snap) => {
      if (cancelled) return;
      setExistingReview(snap.exists() ? (snap.data() as Review) : null);
    }).catch(() => {
      if (!cancelled) setExistingReview(null);
    });
    return () => { cancelled = true; };
  }, [db, order.id, order.statut]);

  const handleReorder = () => {
    order.plats.forEach(item => {
      const menuItem = getMenuItem(item.id);
      if (menuItem) {
        addToCart({ ...item });
      }
    });
    toast({
      title: "Commande ajoutée au panier",
      description: `Les articles de votre commande chez ${order.nomRestaurant} ont été ajoutés.`,
    });
  }

  const getItemPrice = (item: typeof order.plats[0]) => {
    const itemPrice = item.prix;
    const sidePrice = item.accompagnementSelectionne?.prix || 0;
    const drinkPrice = item.boissonSelectionnee?.prix || 0;
    return (itemPrice + sidePrice + drinkPrice) * item.quantite;
  }

  return (
    <Card className="glass overflow-hidden border-white/5 transition-all duration-300 hover:border-primary/20 hover:shadow-xl rounded-2xl sm:rounded-3xl">
      <Accordion type="single" collapsible>
        <AccordionItem value={order.id} className="border-b-0">
          <AccordionTrigger className="p-3.5 sm:p-5 md:p-6 hover:no-underline group">
            <div className="flex justify-between items-center w-full gap-2">
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-base sm:text-lg uppercase tracking-tight group-hover:text-primary transition-colors duration-200 truncate max-w-[150px] sm:max-w-none">{order.nomRestaurant}</p>
                  {order.prioritaire && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                      <Crown className="h-2.5 w-2.5" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                  {new Date(order.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-black text-sm sm:text-base text-primary tracking-tight">{order.total.toLocaleString('fr-FR')} <span className="text-[9px] opacity-70">FCFA</span></p>
                </div>
                <Badge variant="outline" className={`rounded-full px-2 sm:px-3 py-0.5 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider border ${
                  order.statut === 'Livrée' 
                    ? 'border-green-500/30 text-green-600 bg-green-500/10' 
                    : 'border-primary/30 text-primary bg-primary/10'
                }`}>
                  {order.statut}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-3.5 sm:p-5 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {order.plats.map((item, index) => {
                const menuItem = getMenuItem(item.id);
                if (!menuItem) return null;
                const placeholder = getPlaceholderImage(item.indiceImage);
                const imageSrc = (item.image && !item.image.includes('picsum.photos'))
                  ? item.image
                  : placeholder.url;
                const isCloudinary = imageSrc.includes('res.cloudinary.com');
                return (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 border border-white/10 shrink-0">
                        {isCloudinary ? (
                          <CldImage
                            src={imageSrc}
                            alt={item.nom}
                            width={48}
                            height={48}
                            crop="fill"
                            gravity="auto"
                            className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                          />
                        ) : (
                          <Image
                            src={imageSrc}
                            alt={item.nom}
                            width={48}
                            height={48}
                            className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                            data-ai-hint={item.indiceImage}
                          />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-bold uppercase text-xs sm:text-sm tracking-tight truncate block">{item.quantite}x {item.nom}</span>
                        <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider opacity-70">
                          {item.accompagnementSelectionne && <span>{item.accompagnementSelectionne.nom}</span>}
                          {item.accompagnementSelectionne && item.boissonSelectionnee && <span> • </span>}
                          {item.boissonSelectionnee && <span>{item.boissonSelectionnee.nom}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-xs sm:text-sm tracking-tight opacity-85 shrink-0 ml-2">{getItemPrice(item).toLocaleString('fr-FR')} <span className="text-[8px] opacity-50">F</span></span>
                  </div>
                )
              })}
            </div>
            
            <div className="my-3 sm:my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="space-y-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider opacity-70">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{order.sousTotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</span>
              </div>
              {order.codePromo && (
                <div className="flex justify-between text-primary">
                  <span>Réduction ({order.codePromo.code})</span>
                  <span>-{order.codePromo.montantReduction.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm sm:text-base text-foreground tracking-tight pt-1">
                <span className="opacity-100 uppercase">Total</span>
                <span className="text-primary">{order.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between normal-case font-medium text-[10px] sm:text-[11px]">
                <span>Paiement</span>
                <span className={order.paiement.statut === 'echoue' ? 'text-rose-500' : ''}>
                  {order.paiement.mode === 'especes'
                    ? 'Espèces à la livraison'
                    : `Mobile Money — ${
                        order.paiement.statut === 'paye' ? 'payé'
                        : order.paiement.statut === 'echoue' ? 'échoué'
                        : 'en attente de confirmation'
                      }`}
                </span>
              </div>
            </div>
            
            {order.statut === 'Livrée' && (
              <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                {existingReview ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    Avis envoyé ({existingReview.note}/5)
                  </div>
                ) : existingReview === null ? (
                  <OrderReviewDialog order={order} onSubmitted={() => setExistingReview(undefined)}>
                    <Button
                      variant="outline"
                      className="rounded-2xl font-black uppercase tracking-widest px-6 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      Laisser un avis
                    </Button>
                  </OrderReviewDialog>
                ) : null}
                <Button
                  onClick={handleReorder}
                  className="rounded-2xl glass-orange text-white font-black uppercase tracking-widest px-8 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Commander à nouveau
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
