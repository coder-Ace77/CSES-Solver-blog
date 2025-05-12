
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude mongodb-client-encryption from client-side bundles
    if (!isServer) {
      config.externals = config.externals || [];
      // Ensure config.externals is an array if it's an object or function
      if (!Array.isArray(config.externals)) {
          const originalExternals = config.externals;
          config.externals = [originalExternals];
      }
      config.externals.push({ 'mongodb-client-encryption': 'mongodb-client-encryption' });
    }
    // Add resolution fallback for 'snappy' if needed, though less likely with the external above
    config.resolve.fallback = config.resolve.fallback || {};
    config.resolve.fallback.snappy = false; // Prevent snappy module errors

    return config;
  },
};

export default nextConfig;
