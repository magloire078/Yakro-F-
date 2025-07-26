
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/cart-context';
import { Sidebar } from '@/components/sidebar';
import { AuthProvider } from '@/contexts/auth-context';
import { MobileHeader } from '@/components/mobile-header';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen">
              <div className="hidden md:flex">
                <Sidebar />
              </div>
              <div className="flex-1 flex flex-col">
                <MobileHeader />
                <main className="flex-1 p-4 md:p-8 bg-muted/30">{children}</main>
              </div>
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
