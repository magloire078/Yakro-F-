'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  Bike,
  BookOpenCheck,
  ClipboardList,
  Compass,
  DollarSign,
  Home,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { CartSheet } from '@/components/cart-sheet';
import { Dock, DockFab, type DockItem } from '@/components/mobile-ui';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';

/**
 * Navigation mobile « Yakro Elite · Nuit & Braise ».
 *
 * Le rendu est délégué aux primitives partagées `Dock` / `DockFab`
 * (`src/components/mobile-ui.tsx`) : dock flottant en verre, quatre liens et,
 * côté client, le panier en action centrale surélevée.
 */

const CLIENT_LINKS: DockItem[] = [
  { id: 'accueil', href: '/', label: 'Accueil', icon: Home },
  // « Explorer » mène à la liste complète de l'accueil : `/restaurants` est la
  // page détail (elle exige `?id=`), pas une liste.
  { id: 'explorer', href: '/#restaurants', label: 'Explorer', icon: Compass },
  { id: 'commandes', href: '/orders', label: 'Commandes', icon: ReceiptText },
  { id: 'profil', href: '/profile', label: 'Moi', icon: UserRound },
];

const RESTAURATEUR_LINKS: DockItem[] = [
  { id: 'dashboard', href: '/restaurateur', label: 'Dashboard', icon: Home },
  { id: 'menus', href: '/dashboard/menu', label: 'Menus', icon: BookOpenCheck },
  { id: 'commandes', href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList },
  { id: 'stats', href: '/dashboard/analytics', label: 'Stats', icon: BarChart },
];

const LIVREUR_LINKS: DockItem[] = [
  { id: 'courses', href: '/livreur', label: 'Courses', icon: Bike },
  { id: 'gains', href: '/dashboard/earnings', label: 'Gains', icon: DollarSign },
];

/**
 * Un lien est actif sur sa route exacte ; les sous-pages du tableau de bord
 * gardent en plus le lien parent actif (ex. `/dashboard/menu/edition`).
 */
function isActiveHref(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return href.startsWith('/dashboard/') && pathname.startsWith(`${href}/`);
}

/**
 * Radix `SheetTrigger asChild` exige un élément DOM qui reçoit la `ref` et le
 * `onClick`. `DockFab` est un bouton de présentation partagé (primitives
 * `mobile-ui`) qui ne relaie pas ces props : ce conteneur transparent
 * (`display: contents`) porte le déclenchement du panier, et le clic sur le
 * FAB (souris, tactile, Entrée/Espace) remonte naturellement jusqu'à lui.
 */
const CartFabTrigger = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function CartFabTrigger({ children, ...props }, ref) {
    return (
      <span ref={ref} {...props} className="contents">
        {children}
      </span>
    );
  }
);

export function BottomNavBar() {
  const { activeRole, userProfile } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Comme avant : pas de dock pour les SuperAdmin ni tant que le profil
  // n'est pas chargé.
  if (!userProfile || userProfile.roleSysteme === 'SuperAdmin') return null;

  if (activeRole === 'restaurateur') {
    const activeId = RESTAURATEUR_LINKS.find(
      (link) => link.href && isActiveHref(pathname, link.href)
    )?.id;
    return <Dock items={RESTAURATEUR_LINKS} activeId={activeId} />;
  }

  if (activeRole === 'livreur') {
    const activeId = LIVREUR_LINKS.find((link) => link.href && isActiveHref(pathname, link.href))?.id;
    return <Dock items={LIVREUR_LINKS} activeId={activeId} />;
  }

  const activeId = CLIENT_LINKS.find((link) => link.href && isActiveHref(pathname, link.href))?.id;

  return (
    <Dock
      items={CLIENT_LINKS}
      activeId={activeId}
      center={
        <CartSheet>
          <CartFabTrigger>
            <DockFab label="Panier" badge={cartCount}>
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </DockFab>
          </CartFabTrigger>
        </CartSheet>
      }
    />
  );
}
