
'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { CartProvider } from '@/contexts/cart-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
