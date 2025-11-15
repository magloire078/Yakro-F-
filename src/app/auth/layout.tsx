
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export default function AuthRoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, userProfile, loading: authLoading, activeRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Redirect if user tries to access a role page they are not currently using
      const currentRoleFromPath = pathname.split('/').pop();
      if (currentRoleFromPath !== activeRole && userProfile?.roleSysteme !== 'SuperAdmin') {
          router.push('/profile-selection');
      }
    }
  }, [user, userProfile, authLoading, router, activeRole, pathname]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
      <div className="flex min-h-screen">
         <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col">
           <MobileHeader />
          <main className="flex-1 p-4 md:p-8 bg-background pb-24 md:pb-8">{children}</main>
          <BottomNavBar />
        </div>
      </div>
  );
}
