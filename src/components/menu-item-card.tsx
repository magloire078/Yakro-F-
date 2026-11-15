'use client';

import { Plus } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { formatFcfa } from '@/lib/utils';
import { FoodImage } from '@/components/food-image';
import { AddToCartDialog } from './add-to-cart-dialog';
import { Button } from './ui/button';

interface MenuItemCardProps {
  item: MenuItem;
}

/**
 * Ligne de plat « Yakro Elite » : texte à gauche (nom, description, prix),
 * photo carrée 92 px à droite et bouton « + » orange chevauchant le coin.
 * Le bouton ouvre le `AddToCartDialog` existant — la logique d'ajout au panier
 * reste entièrement portée par ce composant.
 */
export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <article className="yk-card group flex gap-3.5 p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="yk-display line-clamp-1 text-[16.5px] leading-tight">{item.nom}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#8A8078] dark:text-white/45">
            {item.description}
          </p>
        )}
        <p className="mt-auto pt-2">
          <span className="yk-display text-[16px] text-orange-600 dark:text-orange-400">
            {formatFcfa(item.prix)}
          </span>
        </p>
      </div>

      <div className="relative h-[92px] w-[92px] shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-slate-100 dark:bg-white/[0.06]">
          <FoodImage
            src={item.image}
            alt={item.nom}
            kind="plat"
            sizes="92px"
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <AddToCartDialog item={item}>
          <Button
            type="button"
            size="icon"
            aria-label={`Ajouter ${item.nom} au panier`}
            className="absolute -bottom-2 -right-2 z-10 h-10 w-10 rounded-full border-[3px] border-white bg-orange-500 text-white shadow-[0_10px_20px_-8px_rgba(249,115,22,0.9)] transition-transform hover:bg-orange-500/90 hover:text-white active:scale-90 dark:border-[#141416]"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </Button>
        </AddToCartDialog>
      </div>
    </article>
  );
}
