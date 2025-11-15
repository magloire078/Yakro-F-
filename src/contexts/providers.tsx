
'use client';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { CartProvider } from '@/contexts/cart-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

const ThemeRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeRole } = useAuth();
  
  React.useEffect(() => {
    // Set theme attribute on the body or a root element
    document.documentElement.setAttribute('data-theme', activeRole || 'client');
  }, [activeRole]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
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
