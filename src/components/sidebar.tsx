

'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { CartSheet } from './cart-sheet';
import { useCart } from '@/contexts/cart-context';
import { Home, History, Star, Megaphone, ChefHat, Bike, LogIn, LogOut, ShoppingCart, Sparkles, ClipboardList, User, Replace } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';

export function Sidebar() {
  const { cartCount } = useCart();
  const { user, loading, activeRole } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <aside className="w-full h-full flex flex-col p-6 bg-card border-r md:w-64">
       <Link href="/" className="mb-12 flex items-center space-x-2">
          <Icons.logo className="h-10 w-10 text-primary" />
          <span className="font-headline text-3xl font-bold text-primary">Yakro Go</span>
        </Link>
        <nav className="flex flex-col gap-4">
          <Button variant="ghost" className="justify-start text-lg" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Accueil
            </Link>
          </Button>
           <Button variant="ghost" className="justify-start text-lg" asChild>
             <Link href="/recommendations">
              <Sparkles className="mr-2 h-5 w-5" />
              Pour Vous
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start text-lg" asChild>
             <Link href="/orders">
              <History className="mr-2 h-5 w-5" />
              Historique
            </Link>
          </Button>
          
          {/* Restaurateur Links */}
          {user && activeRole === 'restaurateur' && (
            <>
              <Button variant="ghost" className="justify-start text-lg" asChild>
                <Link href="/dashboard">
                  <ChefHat className="mr-2 h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start text-lg" asChild>
                <Link href="/dashboard/orders">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Gérer les commandes
                </Link>
              </Button>
               <Button variant="ghost" className="justify-start text-lg" asChild>
                <Link href="/marketing">
                  <Megaphone className="mr-2 h-5 w-5" />
                  Marketing IA
                </Link>
              </Button>
            </>
          )}

          {/* Livreur Links */}
           {user && activeRole === 'livreur' && (
              <Button variant="ghost" className="justify-start text-lg" asChild>
                <Link href="/delivery">
                  <Bike className="mr-2 h-5 w-5" />
                  Espace Livreur
                </Link>
              </Button>
          )}

        </nav>

        <div className="mt-auto space-y-4">
           {!loading && !user && (
            <Button variant="outline" className="w-full text-lg py-6" asChild>
                <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    Connexion
                </Link>
            </Button>
           )}
           {!loading && user && (
            <div className="space-y-4">
                <Button variant="ghost" className="w-full text-md" asChild>
                    <Link href="/profile-selection">
                        <Replace className="mr-2 h-5 w-5" />
                        Changer de profil
                    </Link>
                </Button>
                <div className="flex items-center gap-3 p-2 rounded-lg border">
                    <Avatar>
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{user.email || 'Utilisateur'}</p>
                         <p className="text-xs text-muted-foreground capitalize">{activeRole}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full text-lg py-6" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Déconnexion
                </Button>
            </div>
           )}
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
        </div>
    </aside>
  );
}
