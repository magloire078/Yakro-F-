'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { Home, ClipboardList, User, BookOpen, BarChart, Rocket, Megaphone, Settings, ChefHat } from 'lucide-react';
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
    <aside className="w-full h-screen flex flex-col p-6 bg-white border-r md:w-64 fixed left-0 top-0 z-50">
       <div className="flex justify-between items-center mb-10">
            <Link href={homeLink} className="flex items-center space-x-3">
                <div className="bg-[#4F46E5]/10 p-2 rounded-xl">
                    <Icons.logo className="h-8 w-8 text-[#4F46E5]" />
                </div>
                <div className="flex flex-col">
                    <span className="font-headline text-xl font-bold text-[#4F46E5] leading-tight">Yakro</span>
                    <span className="font-headline text-xl font-bold text-[#4F46E5] leading-tight ml-1">Fê</span>
                </div>
            </Link>
            <div className="hidden md:block">
                <ThemeToggle />
            </div>
        </div>
        
       <nav className="flex flex-col gap-1">
           <Button variant={pathname === homeLink || pathname === '/' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href={homeLink}>
                  <Home className="mr-3 h-4 w-4" />
                  Accueil
                </Link>
           </Button>

          {activeRole === 'restaurateur' && (
            <>
              <Button variant={pathname === '/dashboard/my-restaurants' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/dashboard/my-restaurants">
                  <ChefHat className="mr-3 h-4 w-4" />
                  Mes Restaurants
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/menu' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/dashboard/menu">
                  <BookOpen className="mr-3 h-4 w-4" />
                  Mes Menus
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/orders' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/dashboard/orders">
                  <ClipboardList className="mr-3 h-4 w-4" />
                  Gérer les commandes
                </Link>
              </Button>
               <Button variant={pathname === '/dashboard/analytics' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart className="mr-3 h-4 w-4" />
                  Statistiques
                </Link>
              </Button>
               <Button variant={pathname === '/marketing' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/marketing">
                  <Megaphone className="mr-3 h-4 w-4" />
                  Marketing IA
                </Link>
              </Button>
              <Button variant={pathname === '/dashboard/boost' ? 'secondary' : 'ghost'} className="justify-start text-sm font-medium h-11 px-3" asChild>
                <Link href="/dashboard/boost">
                  <Rocket className="mr-3 h-4 w-4" />
                  Booster la visibilité
                </Link>
              </Button>
            </>
          )}
        </nav>

        <div className="mt-20 mb-auto flex justify-center">
            <div className="h-10 w-10 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold">N</div>
        </div>

        <div className="mt-auto">
           {!loading && user && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <Avatar className="h-10 w-10 rounded-xl">
                            <AvatarFallback className="bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-bold">{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate leading-tight text-neutral-800">{userProfile?.nom || user.email}</p>
                            <p className="text-[10px] text-neutral-400 capitalize font-medium">{activeRole}</p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="start">
                    <DropdownMenuLabel>{userProfile?.nom || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4"/>
                          Mon Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <Settings className="mr-2 h-4 w-4"/>
                        Déconnexion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           )}
        </div>
    </aside>
  );
}