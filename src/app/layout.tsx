import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/cart-context';
import { Sidebar } from '@/components/sidebar';
import { ImageProvider } from '@/contexts/image-context';

export const metadata: Metadata = {
  title: 'Yakro Fê',
  description: 'Votre ville, livrée.',
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
      </head>
      <body className="font-body antialiased">
        <ImageProvider>
          <CartProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-8 bg-muted/30">{children}</main>
            </div>
            <Toaster />
          </CartProvider>
        </ImageProvider>
      </body>
    </html>
  );
}
