
'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Sidebar } from './sidebar';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from './theme-toggle';

export function MobileHeader() {
  const { cartCount } = useCart();
  const { activeRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/60 bg-white/70 backdrop-blur-md px-4 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
         <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-8 w-8 text-primary" />
          </Link>
      </div>
      <ThemeToggle />
      {activeRole === 'client' && (
        <CartSheet>
              <Button variant="outline" size="icon" className="relative">
                <Icons.cart className="h-5 w-5" />
                <span className="sr-only">Ouvrir le panier</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </CartSheet>
      )}
    </header>
  );
}
