
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { Home, History, Megaphone, ChefHat, Bike, LogOut, ShoppingCart, Sparkles, ClipboardList, User, Settings, BookOpenCheck, BarChart, Rocket, DollarSign, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import type { AppRole } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export function Sidebar() {
  const { cartCount } = useCart();
  const { user, loading, activeRole, setActiveRole, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('activeRole');
    router.push('/login');
  }
  
  const handleRoleChange = (newRole: AppRole) => {
    if (userProfile?.rolesAutorises?.includes(newRole)) {
      setActiveRole(newRole);
      router.push(`/auth/${newRole}`);
    }
  }

  const getInitials = (nameOrEmail: string | null | undefined) => {
    if (!nameOrEmail) return '?';
    const nameParts = nameOrEmail.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  }
  
  const getHomeLink = () => {
    if (!user) return "/login";
    if (userProfile?.roleSysteme === 'SuperAdmin') return "/dashboard/admin";
    return `/auth/${activeRole}`;
  }


  return (
    <aside className="w-full h-full flex flex-col p-6 bg-card border-r md:w-64">
       <Link href={getHomeLink()} className="mb-8 flex items-center space-x-2">
          <Icons.logo className="h-10 w-10 text-primary" />
          <span className="font-headline text-3xl font-bold text-primary">Yakro Fê</span>
        </Link>
        
        {user && userProfile && userProfile.roleSysteme !== 'SuperAdmin' && userProfile.rolesAutorises && userProfile.rolesAutorises.length > 1 && (
          <div className="mb-8">
            <Select onValueChange={handleRoleChange} value={activeRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Changer de profil" />
              </SelectTrigger>
              <SelectContent>
                {userProfile.rolesAutorises.map(role => (
                  <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex flex-col gap-4">
           {/* Common Link */}
           <Button variant={pathname === getHomeLink() ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href={getHomeLink()}>
                  <Home className="mr-2 h-5 w-5" />
                  Accueil
                </Link>
           </Button>

          {/* Client Links */}
          {activeRole === 'client' && (
            <>
               <Button variant={pathname === '/recommendations' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                 <Link href="/recommendations">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Pour Vous
                </Link>
              </Button>
              <Button variant={pathname === '/orders' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                 <Link href="/orders">
                  <History className="mr-2 h-5 w-5" />
                  Historique
                </Link>
              </Button>
            </>
          )}
          
          {/* Restaurateur Links */}
          {activeRole === 'restaurateur' && (
            <>
              <Button variant={pathname === '/dashboard/my-restaurants' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/my-restaurants">
                  <UtensilsCrossed className="mr-2 h-5 w-5" />
                  Mes Restaurants
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/menu' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/menu">
                  <BookOpenCheck className="mr-2 h-5 w-5" />
                  Mes Menus
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/orders' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/orders">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Gérer les commandes
                </Link>
              </Button>
               <Button variant={pathname === '/dashboard/analytics' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart className="mr-2 h-5 w-5" />
                  Statistiques
                </Link>
              </Button>
               <Button variant={pathname === '/marketing' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/marketing">
                  <Megaphone className="mr-2 h-5 w-5" />
                  Marketing IA
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/boost' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/boost">
                  <Rocket className="mr-2 h-5 w-5" />
                  Booster la visibilité
                </Link>
              </Button>
            </>
          )}

          {/* Livreur Links */}
          {activeRole === 'livreur' && (
            <>
              <Button variant={pathname === '/dashboard/earnings' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
                <Link href="/dashboard/earnings">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Mes Gains
                </Link>
              </Button>
            </>
          )}

          {/* Super Admin Link */}
          {userProfile?.roleSysteme === 'SuperAdmin' && (
            <Button variant={pathname === '/dashboard/admin' ? 'secondary' : 'ghost'} className="justify-start text-lg" asChild>
              <Link href="/dashboard/admin">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Admin
              </Link>
            </Button>
          )}

        </nav>

        <div className="mt-auto space-y-4">
           {!loading && !user && (
            <Button variant="outline" className="w-full text-lg py-6" asChild>
                <Link href="/login">
                    Se connecter
                </Link>
            </Button>
           )}
           {!loading && user && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted">
                        <Avatar>
                            <AvatarFallback>{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate">{userProfile?.nom || user.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{userProfile?.roleSysteme === 'SuperAdmin' ? 'Super Admin' : activeRole}</p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2">
                    <DropdownMenuLabel>{userProfile?.nom || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4"/>
                          Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4"/>
                        Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Déconnexion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           )}
            {activeRole === 'client' && (
               <div className="hidden md:block">
                <CartSheet>
                  <Button variant="default" className="w-full text-lg py-6">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Panier
                    {cartCount > 0 && (
                      <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{cartCount}</span>
                    )}
                  </Button>
                </CartSheet>
              </div>
            )}
        </div>
    </aside>
  );
}
