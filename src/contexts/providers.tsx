
'use client';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { CartProvider } from '@/contexts/cart-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';
import { FirebaseProvider } from './firebase-provider';
import { usePathname } from 'next/navigation';

const ThemeRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, activeRole } = useAuth();
  const pathname = usePathname();
  
  React.useEffect(() => {
    let theme: string = activeRole || 'client';

    if (userProfile?.roleSysteme === 'SuperAdmin' || pathname.startsWith('/dashboard/admin')) {
      theme = 'admin';
    } else if (pathname.startsWith('/restaurateur') || pathname.startsWith('/dashboard')) {
        theme = 'restaurateur';
    } else if (pathname.startsWith('/livreur')) {
        theme = 'livreur';
    } else {
        theme = 'client';
    }

    document.documentElement.setAttribute('data-theme', theme);
  }, [activeRole, userProfile, pathname]);

  return <>{children}</>;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseProvider>
        <AuthProvider>
          <ThemeRoleProvider>
            <DataProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </DataProvider>
          </ThemeRoleProvider>
        </AuthProvider>
      </FirebaseProvider>
    </NextThemesProvider>
  );
}
