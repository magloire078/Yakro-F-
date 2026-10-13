'use client';

import * as React from 'react';
import type { Order, Review } from '@/lib/types';
import { Sparkles, Star, RotateCcw, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderReviewDialog } from '@/components/order-review-dialog';
import { useCart } from '@/contexts/cart-context';
import { useData } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OrderDeliveredBannerProps {
  order: Order;
  className?: string;
}

export function OrderDeliveredBanner({ order, className }: OrderDeliveredBannerProps) {
  const { addToCart } = useCart();
  const { getMenuItem } = useData();
  const { db } = useFirebase();
  const { toast } = useToast();

  const [existingReview, setExistingReview] = React.useState<Review | null | undefined>(undefined);

  React.useEffect(() => {
    if (order.statut !== 'Livrée' || !db) return;
    let cancelled = false;
    getDoc(doc(db, 'avis', order.id))
      .then((snap) => {
        if (cancelled) return;
        setExistingReview(snap.exists() ? (snap.data() as Review) : null);
      })
      .catch(() => {
        if (!cancelled) setExistingReview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [db, order.id, order.statut]);

  const handleReorder = () => {
    let count = 0;
    order.plats.forEach((item) => {
      const menuItem = getMenuItem(item.id);
      if (menuItem) {
        addToCart({ ...item });
        count++;
      }
    });
    toast({
      title: 'Plats ajoutés au panier !',
      description: `${count} article(s) de chez ${order.nomRestaurant} ont été réinjectés dans votre panier.`,
    });
  };

  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-500',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 shadow-md shadow-emerald-500/10">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              Livraison validée
            </span>
          </div>
          <h2 className="font-headline font-black text-lg sm:text-xl text-foreground">
            Bon appétit chez vous !
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Votre commande a été remise en mains propres. Aidez les autres gourmets en partageant votre expérience sur la cuisine de{' '}
            <span className="font-bold text-foreground">{order.nomRestaurant}</span>.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
        {existingReview ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Avis transmis ({existingReview.note}/5) · Merci !</span>
          </div>
        ) : existingReview === null ? (
          <OrderReviewDialog order={order} onSubmitted={() => setExistingReview(undefined)}>
            <Button
              className="rounded-xl h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> Donner mon avis
            </Button>
          </OrderReviewDialog>
        ) : (
          <div className="text-xs text-muted-foreground">Vérification de l’avis...</div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReorder}
            className="rounded-xl h-10 px-4 text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Commander à nouveau
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-xl h-10 px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <Utensils className="h-3.5 w-3.5 mr-1" /> Accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
