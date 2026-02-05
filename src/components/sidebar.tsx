'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { Home, History, Megaphone, ChefHat, Bike, LogOut, ShoppingCart, Sparkles, ClipboardList, User, Settings, BookOpenCheck, BarChart, Rocket, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import type { AppRole } from '@/lib/types';
import { ThemeToggle } from './theme-toggle';
import { useFirebase } from '@/contexts/firebase-provider';
import { useToast } from '@/hooks/use-toast';

export function Sidebar() {
  const { cartCount } = useCart();
  const { auth } = useFirebase();
  const { user, loading, activeRole, setActiveRole, userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
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
    if (activeRole === 'restaurateur') return '/restaurateur';
    if (activeRole === 'livreur') return '/livreur';
    return '/';
  }
  
  const handleRoleChange = async (newRole: AppRole) => {
    if (!userProfile) return;
    try {
      await updateUserProfile(userProfile.uid, { role: newRole });
      setActiveRole(newRole); 
      toast({
        title: 'Rôle mis à jour',
        description: `Vous êtes maintenant en mode ${newRole}.`,
      });
      if (newRole === 'restaurateur') {
        router.push('/restaurateur');
      } else if (newRole === 'livreur') {
        router.push('/livreur');
      } else {
        router.push('/');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de changer de rôle pour le moment.',
      });
    }
  };

  const homeLink = getHomeLink();

  return (
    <aside className="w-full h-full flex flex-col p-6 bg-card border-r md:w-64">
       <div className="flex justify-between items-center mb-8">
            <Link href={homeLink} className="flex items-center space-x-2">
                <Icons.palm className="h-10 w-10 text-[#4F46E5]" />
                <div className="flex flex-col">
                    <span className="font-headline text-2xl font-bold text-[#4F46E5] leading-none">Yakro</span>
                    <span className="font-headline text-2xl font-bold text-[#4F46E5] leading-none ml-2">Fê</span>
                </div>
            </Link>
            <div className="hidden md:block">
                <ThemeToggle />
            </div>
        </div>
        
       <nav className="flex flex-col gap-2">
           <Button variant={pathname === homeLink || pathname === '/' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href={homeLink}>
                  <Home className="mr-3 h-5 w-5" />
                  Accueil
                </Link>
           </Button>

          {activeRole === 'client' && (
            <>
               <Button variant={pathname === '/recommendations' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                 <Link href="/recommendations">
                  <Sparkles className="mr-3 h-5 w-5" />
                  Pour Vous
                </Link>
              </Button>
              <Button variant={pathname === '/orders' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                 <Link href="/orders">
                  <History className="mr-3 h-5 w-5" />
                  Historique
                </Link>
              </Button>
            </>
          )}
          
          {activeRole === 'restaurateur' && (
            <>
              <Button variant={pathname === '/dashboard/my-restaurants' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/my-restaurants">
                  <UtensilsCrossed className="mr-3 h-5 w-5" />
                  Mes Restaurants
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/menu' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/menu">
                  <BookOpenCheck className="mr-3 h-5 w-5" />
                  Mes Menus
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/orders' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/orders">
                  <ClipboardList className="mr-3 h-5 w-5" />
                  Gérer les commandes
                </Link>
              </Button>
               <Button variant={pathname === '/dashboard/analytics' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart className="mr-3 h-5 w-5" />
                  Statistiques
                </Link>
              </Button>
               <Button variant={pathname === '/marketing' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/marketing">
                  <Megaphone className="mr-3 h-5 w-5" />
                  Marketing IA
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/boost' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/boost">
                  <Rocket className="mr-3 h-5 w-5" />
                  Booster la visibilité
                </Link>
              </Button>
            </>
          )}

          {activeRole === 'livreur' && (
            <>
              <Button variant={pathname === '/dashboard/earnings' ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
                <Link href="/dashboard/earnings">
                  <DollarSign className="mr-3 h-5 w-5" />
                  Mes Gains
                </Link>
              </Button>
            </>
          )}

          {userProfile?.roleSysteme === 'SuperAdmin' && (
            <Button variant={pathname.startsWith('/dashboard/admin') ? 'secondary' : 'ghost'} className="justify-start text-base font-medium h-12" asChild>
              <Link href="/dashboard/admin">
                <ShieldCheck className="mr-3 h-5 w-5" />
                Administration
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
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/5 cursor-pointer hover:bg-muted transition-colors bg-muted/20">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate leading-tight">{userProfile?.nom || user.email}</p>
                            <p className="text-[10px] text-muted-foreground capitalize font-bold opacity-70 tracking-wide">{userProfile?.roleSysteme === 'SuperAdmin' ? 'Super Admin' : activeRole}</p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2">
                    <DropdownMenuLabel>{userProfile?.nom || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4"/>
                          Mon Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Changer de rôle</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => handleRoleChange('client')} disabled={activeRole === 'client'}>
                        <User className="mr-2 h-4 w-4"/>
                        Client
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleRoleChange('restaurateur')} disabled={activeRole === 'restaurateur'}>
                        <ChefHat className="mr-2 h-4 w-4"/>
                        Restaurateur
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleRoleChange('livreur')} disabled={activeRole === 'livreur'}>
                        <Bike className="mr-2 h-4 w-4"/>
                        Livreur
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
                  <Button variant="default" className="w-full text-lg py-6 shadow-lg bg-[#6366F1] hover:bg-[#4F46E5]">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Panier
                    {cartCount > 0 && (
                      <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#6366F1] text-xs font-bold">{cartCount}</span>
                    )}
                  </Button>
                </CartSheet>
              </div>
            )}
        </div>
    </aside>
  );
}
