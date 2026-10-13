
'use client';

import { Card } from './ui/card';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import type { MenuItem } from '@/lib/types';

import { AddToCartDialog } from './add-to-cart-dialog';
import * as React from 'react';
import { FoodImage } from '@/components/food-image';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <Card className="flex flex-col p-2 xs:p-2.5 sm:p-3.5 glass transition-all duration-300 group rounded-xl xs:rounded-2xl border-white/5 hover:border-primary/30 hover:bg-white/10 shadow-xs hover:shadow-lg h-full justify-between">
      <div>
        <div className="relative w-full h-24 xs:h-28 sm:h-36 shrink-0 overflow-hidden rounded-lg xs:rounded-xl shadow-inner bg-slate-100 dark:bg-slate-800 mb-2">
          <FoodImage
            src={item.image}
            alt={item.nom}
            kind="plat"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="space-y-0.5 xs:space-y-1">
          <h4 className="font-bold uppercase tracking-tight text-xs xs:text-sm group-hover:text-primary transition-colors duration-200 line-clamp-1">{item.nom}</h4>
          <p className="text-[10px] xs:text-[11px] text-muted-foreground line-clamp-2 leading-tight opacity-80">{item.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 mt-auto">
        <p className="text-xs xs:text-sm font-black text-primary tracking-tight">
          {item.prix.toLocaleString('fr-FR')} <span className="text-[9px] xs:text-[10px] opacity-70">FCFA</span>
        </p>
        <AddToCartDialog item={item}>
          <Button variant="ghost" size="icon" className="h-7 w-7 xs:h-8 xs:w-8 rounded-lg xs:rounded-xl bg-primary text-white hover:bg-primary/90 hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95 shrink-0">
            <PlusCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </Button>
        </AddToCartDialog>
      </div>
    </Card>
  );
}
