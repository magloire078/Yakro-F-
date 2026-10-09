'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { cn } from '@/lib/utils';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  
  const isLandingOrAuthPage = 
    pathname === '/login' || 
    pathname === '/profile-selection' || 
    pathname === '/complete-profile' ||
    pathname === '/intro' ||
    pathname === '/marketing' ||
    (!user && pathname === '/');

  // Les pages d'authentification (login, sélection/complétion de profil…)
  // gèrent elles-mêmes leur état de chargement et d'erreur (voir leurs
  // propres écrans dédiés) — on les laisse toujours s'afficher plutôt que
  // de les bloquer ici derrière un spinner générique sans contexte pendant
  // tout le cycle de nouvelles tentatives de lecture du profil (jusqu'à
  // ~15s sur réseau lent), qui laissait l'appli entière figée sans
  // explication ni possibilité de réessayer.
  if (isLandingOrAuthPage) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/restaurateur');

  return (
    <div className={cn(
      "flex min-h-screen transition-colors duration-300",
      isDashboard ? "bg-[#0A0A0B] text-white dark" : "bg-background text-foreground"
    )}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col md:pl-64">
        <MobileHeader />
        <main className={cn(
          "flex-1 pb-20 md:pb-10",
          isDashboard ? "p-0" : "p-3 sm:p-4 md:p-8 lg:p-10"
        )}>
          {children}
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}