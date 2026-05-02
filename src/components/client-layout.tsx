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

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isLandingOrAuthPage) {
    return <>{children}</>;
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
          "flex-1 pb-24 md:pb-10",
          isDashboard ? "p-0" : "p-4 md:p-10"
        )}>
          {children}
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}