
'use client';

import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import type { MenuItem } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { AddToCartDialog } from './add-to-cart-dialog';
import * as React from 'react';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const imageSrc = item.image || `https://placehold.co/100x100.png`;

  return (
    <Card className="flex items-center p-4 gap-4 shadow-md hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative w-24 h-24 shrink-0">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          className="rounded-lg object-cover"
          data-ai-hint={item.imageHint}
        />
      </div>
      <div className="flex-1">
        <h4 className="font-bold font-headline">{item.name}</h4>
        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{item.description}</p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-lg font-semibold text-primary">{item.price.toLocaleString('fr-FR')} FCFA</p>
          <AddToCartDialog item={item} imageSrc={imageSrc}>
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary">
              <PlusCircle className="w-6 h-6" />
            </Button>
          </AddToCartDialog>
        </div>
      </div>
    </Card>
  );
}
