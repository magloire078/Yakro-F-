
'use client';
 
import * as React from 'react';
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
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 border-b border-orange-100/50 dark:border-slate-800/50 px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-colors">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-r border-orange-100/50 dark:border-slate-800/50">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex justify-center">
         <Link href="/" className="flex items-center space-x-2 active:scale-95 transition-transform">
            <Icons.logo className="h-9 w-9 text-orange-500" />
          </Link>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {activeRole === 'client' && (
          <CartSheet>
                <Button variant="ghost" size="icon" className="relative hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-colors">
                  <Icons.cart className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le panier</span>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg shadow-orange-500/20 animate-in zoom-in">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </CartSheet>
        )}
      </div>
    </header>
  );
}
