'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

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

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col md:pl-64">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}