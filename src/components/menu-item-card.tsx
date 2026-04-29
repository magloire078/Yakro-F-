'use client';

import Image from 'next/image';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { PlusCircle, Lock, Sparkles, Star } from 'lucide-react';
import type { MenuItem, HappyHour } from '@/lib/types';
import { AddToCartDialog } from './add-to-cart-dialog';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { getDietaryTag } from '@/lib/dietary';
import { applyHappyHourDiscount } from '@/lib/promotions';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  disabled?: boolean;
  happyHour?: HappyHour | null;
  isPlatDuJour?: boolean;
}

export function MenuItemCard({ item, disabled = false, happyHour = null, isPlatDuJour = false }: MenuItemCardProps) {
  const placeholder = getPlaceholderImage(item.indiceImage);
  const imageSrc = (item.image && !item.image.includes('picsum.photos'))
    ? item.image
    : placeholder.url;

  const unavailable = item.indisponible || disabled;
  const discountedPrice = happyHour ? applyHappyHourDiscount(item.prix, happyHour) : null;

  return (
    <Card className={cn(
      "flex items-center p-4 gap-4 shadow-md hover:shadow-xl transition-shadow duration-300 group relative",
      isPlatDuJour && "border-2 border-yellow-400",
      item.indisponible && "opacity-70"
    )}>
      <div className="relative w-24 h-24 shrink-0">
        <Image
          src={imageSrc}
          alt={item.nom}
          width={placeholder.width}
          height={placeholder.height}
          className={cn("rounded-lg object-cover w-full h-full", item.indisponible && "grayscale")}
          data-ai-hint={item.indiceImage}
        />
        {item.indisponible && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <Badge variant="destructive" className="text-[10px]">Indisponible</Badge>
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start gap-2">
          <h4 className="font-bold font-headline flex-1">{item.nom}</h4>
          {isPlatDuJour && (
            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 shrink-0">
              <Star className="h-3 w-3 mr-1 fill-current" /> Plat du jour
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{item.description}</p>
        {item.tagsDiet && item.tagsDiet.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tagsDiet.map(t => {
              const info = getDietaryTag(t);
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  title={info.description}
                >
                  <span>{info.emoji}</span>
                  {info.shortLabel}
                </span>
              );
            })}
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-baseline gap-2">
            {discountedPrice !== null ? (
              <>
                <p className="text-lg font-semibold text-primary">{discountedPrice.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-sm text-muted-foreground line-through">{item.prix.toLocaleString('fr-FR')}</p>
                <Badge variant="default" className="bg-pink-500 hover:bg-pink-500 text-[10px]">
                  <Sparkles className="h-3 w-3 mr-0.5" /> -{happyHour!.pourcentage}%
                </Badge>
              </>
            ) : (
              <p className="text-lg font-semibold text-primary">{item.prix.toLocaleString('fr-FR')} FCFA</p>
            )}
          </div>
          {unavailable ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground" disabled aria-label={item.indisponible ? 'Plat indisponible' : 'Restaurant fermé'}>
              <Lock className="w-5 h-5" />
            </Button>
          ) : (
            <AddToCartDialog item={item}>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary">
                <PlusCircle className="w-6 h-6" />
              </Button>
            </AddToCartDialog>
          )}
        </div>
      </div>
    </Card>
  );
}
