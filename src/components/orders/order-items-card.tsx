'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { FoodImage } from '@/components/food-image';
import { ShoppingBag, ChevronDown, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrderItemsCardProps {
  order: Order;
  className?: string;
}

export function OrderItemsCard({ order, className }: OrderItemsCardProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [hasCopied, setHasCopied] = React.useState(false);
  const { toast } = useToast();

  const totalItemsCount = React.useMemo(() => {
    return order.plats.reduce((acc, p) => acc + (p.quantite || 1), 0);
  }, [order.plats]);

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setHasCopied(true);
      toast({ title: 'Numéro copié !', description: `#${order.id}` });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de copier l’identifiant.' });
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Suivi Commande Yakro-Fê #${order.id.slice(0, 6)}`,
          text: `Suivez ma commande chez ${order.nomRestaurant} en temps réel sur Yakro-Fê !`,
          url,
        });
        return;
      } catch (err) {
        // Ignorer l'annulation de partage de l'utilisateur
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: copier le lien dans le presse-papier
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié !', description: 'Le lien de suivi a été copié dans votre presse-papier.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de partager le lien.' });
    }
  };

  return (
    <div className={cn('bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md', className)}>
      {/* En-tête cliquable */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-left focus:outline-none flex-1 group"
        >
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm sm:text-base text-foreground uppercase tracking-tight">
                Détail de la commande
              </p>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {totalItemsCount} {totalItemsCount > 1 ? 'articles' : 'article'}
              </span>
            </div>
            <p className="text-2xs text-muted-foreground">Chez {order.nomRestaurant}</p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
            title="Partager le suivi"
            aria-label="Partager le suivi"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? 'Replier le détail' : 'Déplier le détail'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {/* Contenu déroulant */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
          {/* Liste des plats */}
          <div className="space-y-3">
            {order.plats.map((item, idx) => {
              const itemTotal =
                (item.prix +
                  (item.accompagnementSelectionne?.prix || 0) +
                  (item.boissonSelectionnee?.prix || 0)) *
                (item.quantite || 1);

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-background/40 border border-border/30 hover:border-orange-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/40">
                      <FoodImage
                        src={item.image}
                        alt={item.nom}
                        kind="plat"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-orange-500">
                          {item.quantite || 1}x
                        </span>
                        <p className="font-bold text-xs sm:text-sm text-foreground truncate">{item.nom}</p>
                      </div>
                      {(item.accompagnementSelectionne || item.boissonSelectionnee) && (
                        <p className="text-2xs text-muted-foreground truncate">
                          {item.accompagnementSelectionne && (
                            <span>+ {item.accompagnementSelectionne.nom}</span>
                          )}
                          {item.accompagnementSelectionne && item.boissonSelectionnee && <span> · </span>}
                          {item.boissonSelectionnee && <span>+ {item.boissonSelectionnee.nom}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                      {itemTotal.toLocaleString('fr-FR')} <span className="text-2xs text-muted-foreground">F</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille financière */}
          <div className="p-3.5 rounded-xl bg-background/50 border border-border/40 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total plats</span>
              <span className="font-mono">{order.sousTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frais de livraison</span>
              <span className="font-mono">{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {order.codePromo && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span className="flex items-center gap-1">
                  Code promo <span className="font-mono uppercase font-black">({order.codePromo.code})</span>
                </span>
                <span className="font-mono">-{order.codePromo.montantReduction.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="pt-2 border-t border-border/40 flex justify-between items-center text-sm font-black text-foreground">
              <span className="uppercase tracking-wider">Total Réglé</span>
              <span className="font-mono text-base text-orange-500 font-black">
                {order.total.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Numéro et copie rapide */}
          <div className="flex items-center justify-between text-2xs text-muted-foreground px-1">
            <span>Réf : <span className="font-mono text-foreground font-semibold">#{order.id}</span></span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyOrderId}
              className="h-6 px-2 text-2xs hover:text-orange-500 gap-1 rounded-md"
            >
              {hasCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" /> Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copier l’ID
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
