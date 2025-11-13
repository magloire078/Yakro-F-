
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/contexts/providers';

export const metadata: Metadata = {
  title: 'Yakro Fê',
  description: 'Votre ville, livrée.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
