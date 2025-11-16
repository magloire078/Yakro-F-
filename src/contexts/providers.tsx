
'use client';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { CartProvider } from '@/contexts/cart-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

const ThemeRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, activeRole } = useAuth();
  
  React.useEffect(() => {
    let theme = activeRole || 'client';
    if (userProfile?.roleSysteme === 'SuperAdmin') {
      theme = 'admin';
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [activeRole, userProfile]);

  return <>{children}</>;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
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
    </NextThemesProvider>
  );
}
