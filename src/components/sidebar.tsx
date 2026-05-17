'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Icons } from './icons';
import { Home, ClipboardList, User, BookOpen, BarChart, Rocket, ChefHat, LogOut, Package, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { useFirebase } from '@/contexts/firebase-provider';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { auth } = useFirebase();
  const { user, loading, activeRole, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    if (onNavigate) onNavigate();
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

  const homeLink = getHomeLink();

  const navItems = [
    { href: homeLink, label: 'Accueil', icon: Home, roles: ['client', 'restaurateur', 'livreur', 'admin'] },
    { href: '/dashboard/my-restaurants', label: 'Mes Restaurants', icon: ChefHat, roles: ['restaurateur'] },
    { href: '/dashboard/menu', label: 'Mes Menus', icon: BookOpen, roles: ['restaurateur'] },
    { href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList, roles: ['restaurateur'] },
    { href: '/dashboard/analytics', label: 'Statistiques', icon: BarChart, roles: ['restaurateur'] },
    { href: '/dashboard/boost', label: 'Visibilité', icon: Rocket, roles: ['restaurateur'] },
    { href: '/dashboard/stock', label: 'Stocks', icon: Package, roles: ['restaurateur'] },
  ];

  return (
    <aside className={cn(
      "flex flex-col h-full p-6 transition-all duration-300 relative",
      "bg-card/80 backdrop-blur-2xl border-r border-border/50",
      "md:w-64 md:fixed md:left-0 md:top-0 md:z-50 md:h-screen"
    )}>
        {/* Mobile Close Button */}
        <div className="md:hidden absolute top-6 right-6 z-50">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onNavigate} 
              aria-label="Fermer le menu"
              className="rounded-xl hover:bg-orange-500/10 text-orange-500 border border-orange-500/10 active:scale-90 transition-all"
            >
                <X className="h-5 w-5" />
            </Button>
        </div>

       <div className="flex justify-between items-center mb-10">
            <Link href={homeLink} onClick={onNavigate} className="flex items-center space-x-3 group">
                <div className="bg-orange-500/10 p-2.5 rounded-xl group-hover:bg-orange-500/20 transition-all border border-orange-500/10">
                    <Icons.logo className="h-8 w-8 text-orange-500" />
                </div>
                <div className="flex flex-col">
                    <span className="font-headline text-2xl font-black text-orange-500 leading-none tracking-tighter italic uppercase">Yakro</span>
                    <span className="font-headline text-2xl font-black text-orange-500 leading-none tracking-tighter italic uppercase ml-1">Fê</span>
                </div>
            </Link>
            <div className="hidden md:block">
                <ThemeToggle />
            </div>
        </div>
        
       <nav className="flex flex-col gap-1.5">
           {navItems.filter(item => item.roles.includes(activeRole || 'client')).map((item) => {
             const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
             return (
               <Button 
                 key={item.href}
                 variant={isActive ? 'secondary' : 'ghost'} 
                 onClick={onNavigate} 
                 className={cn(
                   "justify-start text-xs font-bold h-12 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest group",
                   isActive 
                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5" 
                    : "text-slate-500 hover:text-orange-500 hover:bg-orange-500/5"
                 )} 
                 asChild
               >
                    <Link href={item.href} className="flex items-center w-full">
                       <item.icon className={cn(
                         "mr-3 h-4 w-4 transition-transform group-hover:scale-110",
                         isActive ? "text-orange-500" : "text-slate-400 group-hover:text-orange-500"
                       )} />
                       {item.label}
                       {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                    </Link>
               </Button>
             );
           })}
        </nav>


        <div className="mt-auto">
           {!loading && user && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted transition-all group active:scale-95">
                        <Avatar className="h-10 w-10 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-500/10">
                            <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-black italic">{getInitials(userProfile?.nom || user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-black truncate leading-tight text-foreground uppercase tracking-tight">{userProfile?.nom || user.email}</p>
                            <p className="text-[11px] text-orange-500 font-black capitalize italic tracking-widest">{activeRole}</p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent aria-label="Menu utilisateur" className="w-64 mb-4 p-2 bg-popover/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl" align="start">
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                     <DropdownMenuItem asChild onClick={onNavigate} className="rounded-xl focus:bg-orange-500/10 focus:text-orange-500 cursor-pointer h-10 mb-1">
                        <Link href="/profile" className="flex items-center font-bold text-xs uppercase tracking-widest">
                          <User className="mr-3 h-4 w-4"/>
                          Mon Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl focus:bg-red-500/10 focus:text-red-500 text-red-500/80 cursor-pointer h-10 font-bold text-xs uppercase tracking-widest">
                        <LogOut className="mr-3 h-4 w-4"/>
                        Déconnexion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
           )}
        </div>
    </aside>

  );
}