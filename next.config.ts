import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Désactivé en dev pour éviter les conflits Turbopack
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: {
    appIsrStatus: false,
  },
  experimental: {
    allowedDevOrigins: [
        '6000-firebase-studio-1753373548918.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
        '9002-firebase-studio-1753373548918.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev'
    ],
    serverActions: {
      bodySizeLimit: '10mb',
    }
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
      }
    ],
  },
};

export default withPWA(nextConfig);
