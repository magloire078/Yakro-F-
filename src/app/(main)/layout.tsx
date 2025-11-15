
'use client';

import * as React from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { useData } from '@/contexts/data-context';
import { Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading } = useData();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
        router.push('/login');
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading || !user) {
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
