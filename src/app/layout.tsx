import './globals.css';
import Providers from '@/contexts/providers';
import { ClientLayout } from '@/components/client-layout';
import { belleza, alegreya } from '@/app/fonts';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Yakro Fê — Livraison de repas à Yamoussoukro',
    template: '%s · Yakro Fê',
  },
  description: 'Les meilleurs restaurants de Yamoussoukro livrés chez vous. Paiement Mobile Money, suivi en direct, fidélité et parrainage.',
  applicationName: 'Yakro Fê',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Yakro Fê',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    title: 'Yakro Fê — Livraison de repas à Yamoussoukro',
    description: 'Commandez les meilleurs plats de Yamoussoukro, payez en Mobile Money, suivez votre livreur en direct.',
    siteName: 'Yakro Fê',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yakro Fê',
    description: 'Livraison de repas à Yamoussoukro.',
  },
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
      <body className={cn("font-body antialiased", belleza.variable, alegreya.variable)}>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
