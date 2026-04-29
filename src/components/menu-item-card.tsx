
'use client';

import Image from 'next/image';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PlusCircle, Lock } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { AddToCartDialog } from './add-to-cart-dialog';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { getDietaryTag } from '@/lib/dietary';

interface MenuItemCardProps {
  item: MenuItem;
  disabled?: boolean;
}

export function MenuItemCard({ item, disabled = false }: MenuItemCardProps) {
  const placeholder = getPlaceholderImage(item.indiceImage);
  const imageSrc = (item.image && !item.image.includes('picsum.photos'))
    ? item.image
    : placeholder.url;

  return (
    <Card className="flex items-center p-4 gap-4 shadow-md hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-24 h-24 shrink-0">
        <Image
          src={imageSrc}
          alt={item.nom}
          width={placeholder.width}
          height={placeholder.height}
          className="rounded-lg object-cover w-full h-full"
          data-ai-hint={item.indiceImage}
        />
      </div>
      <div className="flex-1">
        <h4 className="font-bold font-headline">{item.nom}</h4>
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
          <p className="text-lg font-semibold text-primary">{item.prix.toLocaleString('fr-FR')} FCFA</p>
          {disabled ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground" disabled aria-label="Restaurant fermé">
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
