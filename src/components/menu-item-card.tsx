
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
    <Card className="flex items-center p-4 gap-5 glass transition-all duration-500 group rounded-[2rem] border-white/5 hover:border-orange-500/30 hover:bg-white/10 shadow-lg hover:shadow-orange-500/10">
      <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-2xl shadow-inner bg-slate-100 dark:bg-slate-800">
        {isCloudinary ? (
          <CldImage
            src={imageSrc}
            alt={item.nom}
            width={placeholder.width}
            height={placeholder.height}
            crop="fill"
            gravity="auto"
            className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={item.nom}
            width={placeholder.width}
            height={placeholder.height}
            className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out"
            data-ai-hint={item.indiceImage}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="font-black uppercase tracking-tighter text-base md:text-lg group-hover:text-orange-500 transition-colors duration-300">{item.nom}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-70">{item.description}</p>
        <div className="flex justify-between items-center pt-2">
          <p className="text-xl font-black text-orange-500 tracking-tighter">{item.prix.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60">FCFA</span></p>
          <AddToCartDialog item={item}>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl glass-orange text-white hover:scale-110 transition-all shadow-lg active:scale-95">
              <PlusCircle className="w-6 h-6" />
            </Button>
          </AddToCartDialog>
        </div>
      </div>
    </Card>
  );
}
