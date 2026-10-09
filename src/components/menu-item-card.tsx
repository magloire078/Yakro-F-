
'use client';

import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import type { MenuItem } from '@/lib/types';

import { AddToCartDialog } from './add-to-cart-dialog';
import * as React from 'react';
import { getPlaceholderImage } from '@/lib/placeholder-images';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const placeholder = getPlaceholderImage(item.indiceImage);
  const imageSrc = (item.image && !item.image.includes('picsum.photos'))
    ? item.image
    : placeholder.url;

  const isCloudinary = imageSrc.includes('res.cloudinary.com');

  return (
    <Card className="flex items-center p-3 sm:p-4 gap-3 sm:gap-4 glass transition-all duration-300 group rounded-2xl border-white/5 hover:border-primary/30 hover:bg-white/10 shadow-sm hover:shadow-lg">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl shadow-inner bg-slate-100 dark:bg-slate-800">
        {isCloudinary ? (
          <CldImage
            src={imageSrc}
            alt={item.nom}
            width={placeholder.width}
            height={placeholder.height}
            crop="fill"
            gravity="auto"
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={item.nom}
            width={placeholder.width}
            height={placeholder.height}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
            data-ai-hint={item.indiceImage}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="font-bold uppercase tracking-tight text-sm sm:text-base group-hover:text-primary transition-colors duration-200 truncate">{item.nom}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1 leading-normal opacity-80">{item.description}</p>
        <div className="flex justify-between items-center pt-1">
          <p className="text-sm sm:text-base font-black text-primary tracking-tight">{item.prix.toLocaleString('fr-FR')} <span className="text-[10px] opacity-70">FCFA</span></p>
          <AddToCartDialog item={item}>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary text-white hover:bg-primary/90 hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </AddToCartDialog>
        </div>
      </div>
    </Card>
  );
}
