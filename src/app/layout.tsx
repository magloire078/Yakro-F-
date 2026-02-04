import './globals.css';
import Providers from '@/contexts/providers';
import { ClientLayout } from '@/components/client-layout';
import { belleza, alegreya } from '@/app/fonts';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn("font-body antialiased", belleza.variable, alegreya.variable)}>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}