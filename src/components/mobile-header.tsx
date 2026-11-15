'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CartSheet } from '@/components/cart-sheet';
import { Icons } from '@/components/icons';
import { Logo } from '@/components/logo';
import { NotificationsBell } from '@/components/notifications-bell';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

/**
 * En-tête mobile « Yakro Elite · Nuit & Braise » : barre de verre chaud
 * (crème en clair, noir braise en sombre), logo à gauche, actions rondes de
 * 40 px à droite. Le menu latéral (Sheet + Sidebar) et le panier (CartSheet)
 * restent les composants existants.
 */

const ROUND_ACTION_BUTTON =
  'h-10 w-10 rounded-full border border-solid border-black/[0.06] bg-white/60 text-[#4A443D] transition-colors hover:bg-white/90 hover:text-[#16130F] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white';

/**
 * Les déclencheurs de `ThemeToggle` et `NotificationsBell` viennent de ces
 * composants partagés : on rend leurs boutons ronds et 40 px depuis ce
 * conteneur, sans modifier les composants eux-mêmes.
 */
const ROUND_ACTION_WRAPPER = cn(
  '[&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full',
  '[&>button]:border [&>button]:border-solid [&>button]:border-black/[0.06]',
  '[&>button]:bg-white/60 [&>button]:text-[#4A443D] [&>button]:transition-colors',
  '[&>button]:hover:bg-white/90 [&>button]:hover:text-[#16130F]',
  'dark:[&>button]:border-white/10 dark:[&>button]:bg-white/[0.06] dark:[&>button]:text-white/70',
  'dark:[&>button]:hover:bg-white/10 dark:[&>button]:hover:text-white'
);

export function MobileHeader() {
  const { cartCount } = useCart();
  const { activeRole } = useAuth();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-[calc(3.25rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b border-black/[0.05] bg-[#FAF7F2]/85 px-3 pt-safe backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0B]/85 md:hidden">
      <div className="flex min-w-0 items-center gap-1">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ouvrir le menu"
              className={cn('shrink-0', ROUND_ACTION_BUTTON)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r border-black/[0.05] p-0 dark:border-white/[0.08]"
          >
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <Logo size="sm" />
      </div>

      <div className="flex items-center gap-1">
        <div className={ROUND_ACTION_WRAPPER}>
          <ThemeToggle />
        </div>

        {activeRole === 'restaurateur' && (
          <div className={ROUND_ACTION_WRAPPER}>
            <NotificationsBell />
          </div>
        )}

        {activeRole === 'client' && (
          <CartSheet>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ouvrir le panier"
              className={cn('relative', ROUND_ACTION_BUTTON)}
            >
              <Icons.cart className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
          </CartSheet>
        )}
      </div>
    </header>
  );
}
