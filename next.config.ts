import type { NextConfig } from 'next';

// Domaine Firebase Hosting qui héberge les pages de connexion (/__/auth/*).
const FIREBASE_AUTH_HOST = 'https://yakro-go.firebaseapp.com';

const nextConfig: NextConfig = {
  // Relais des pages de connexion Firebase sur le domaine de l'app, pour que
  // la connexion Google fonctionne sur Safari iOS (voir src/firebase/client.ts
  // et NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).
  async rewrites() {
    return [
      { source: '/__/auth/:path*', destination: `${FIREBASE_AUTH_HOST}/__/auth/:path*` },
      { source: '/__/firebase/:path*', destination: `${FIREBASE_AUTH_HOST}/__/firebase/:path*` },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  allowedDevOrigins: [
    '6000-firebase-studio-1753373548918.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
    '9002-firebase-studio-1753373548918.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
    'localhost:9002',
    '0.0.0.0:9002',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize chunking to reduce ChunkLoadError in large apps
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
