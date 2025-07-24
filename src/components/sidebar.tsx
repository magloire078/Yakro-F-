
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { Home, History, ShoppingCart, Star, Video } from 'lucide-react';

export function Sidebar() {
  const { cartCount } = useCart();

  return (
    <aside className="w-64 flex flex-col p-6 bg-card border-r">
       <Link href="/" className="mb-12 flex items-center space-x-2">
          <Icons.logo className="h-10 w-10 text-primary" />
          <span className="font-headline text-3xl font-bold text-primary">Yakro Fê</span>
        </Link>
        <nav className="flex flex-col gap-4">
          <Button variant="ghost" className="justify-start text-lg" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Accueil
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start text-lg" asChild>
             <Link href="/orders">
              <History className="mr-2 h-5 w-5" />
              Historique
            </Link>
          </Button>
           <Button variant="ghost" className="justify-start text-lg" asChild>
             <Link href="/reviews">
              <Star className="mr-2 h-5 w-5" />
              Avis
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start text-lg" asChild>
             <Link href="/marketing">
              <Video className="mr-2 h-5 w-5" />
              Marketing
            </Link>
          </Button>
        </nav>

        <div className="mt-auto">
           <CartSheet>
            <Button variant="default" className="w-full text-lg py-6">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Panier
              {cartCount > 0 && (
                <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </CartSheet>
        </div>
    </aside>
  );
}
