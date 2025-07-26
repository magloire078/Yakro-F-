
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { CartProvider } from '@/contexts/cart-context';

export const metadata: Metadata = {
  title: 'Yakro Go',
  description: 'Votre ville, livrée.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <DataProvider>
            <CartProvider>
                {children}
              <Toaster />
            </CartProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
