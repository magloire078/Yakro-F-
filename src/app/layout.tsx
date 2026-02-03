
'use client';

import './globals.css';
import Providers from '@/contexts/providers';
import { MobileHeader } from '@/components/mobile-header';
import { useData } from '@/contexts/data-context';
import { Loader } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import * as React from 'react';
import { Sidebar } from '@/components/sidebar';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { usePathname } from 'next/navigation';
import { belleza, alegreya } from '@/app/fonts';
import { cn } from '@/lib/utils';
import type { Viewport } from 'next';

const metadata = {
  title: 'Yakro Fê',
  description: 'Votre ville, livrée intelligemment.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF8C00',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="manifest" href={metadata.manifest} />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className={cn("font-body antialiased", belleza.variable, alegreya.variable)}>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: dataLoading } = useData();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/profile-selection';

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
        <BottomNavBar />
      </div>
    </div>
  );
}
