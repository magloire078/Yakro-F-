
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: {
    allowedDevOrigins: [
        'https://6000-firebase-studio-1753373548918.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev'
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    }
  },
};

let finalConfig: NextConfig = nextConfig;

// The PWA plugin uses Webpack, which is not compatible with Turbopack in development.
// We only apply the PWA wrapper for production builds.
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public'
  });
  finalConfig = withPWA(nextConfig);
}

export default finalConfig;
