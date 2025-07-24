'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { History, ShoppingCart } from 'lucide-react';

export function Header() {
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Yakro Fê</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Accueil
          </Link>
          <Link href="/orders" className="transition-colors hover:text-primary">
            Historique
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <CartSheet>
            <Button variant="ghost" className="relative">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </CartSheet>
        </div>
      </div>
    </header>
  );
}
