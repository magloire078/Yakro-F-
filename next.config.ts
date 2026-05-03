import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
