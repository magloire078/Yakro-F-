
'use client';
 
import * as React from 'react';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Sidebar } from './sidebar';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { NotificationsBell } from './notifications-bell';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from './theme-toggle';

import { Logo } from './logo';

export function MobileHeader() {
  const { cartCount } = useCart();
  const { activeRole } = useAuth();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 border-b border-primary/10 dark:border-slate-800/50 px-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-r border-primary/10 dark:border-slate-800/50">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex justify-center">
         <Logo size="sm" />
      </div>
      <div className="flex items-center gap-0.5">
        <ThemeToggle />
        {activeRole === 'restaurateur' && <NotificationsBell />}
        {activeRole === 'client' && (
          <CartSheet>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                  <Icons.cart className="h-5 w-5" />
                  <span className="sr-only">Ouvrir le panier</span>
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-lg shadow-primary/20 animate-in zoom-in">
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
