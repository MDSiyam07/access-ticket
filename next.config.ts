import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

// Type pour les options PWA étendues
interface PWAPluginOptions {
  dest: string;
  register: boolean;
  disable: boolean;
  runtimeCaching?: Array<{
    urlPattern: RegExp;
    handler: string;
    options: {
      cacheName: string;
      expiration: {
        maxEntries: number;
        maxAgeSeconds: number;
      };
      cacheableResponse: {
        statuses: number[];
      };
    };
  }>;
  additionalManifestEntries?: Array<{
    url: string;
    revision: string;
  }>;
  fallbacks?: {
    document: string;
  };
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'html5-qrcode'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions critiques pour PWA - syntaxe corrigée
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },
          // Content Security Policy pour PWA - beaucoup plus permissif pour la caméra
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: data: https:; connect-src 'self' https: wss: ws:; font-src 'self' https:; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

const pwaOptions: PWAPluginOptions = {
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  // Ajouts importants pour PWA
  runtimeCaching: [{
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  // Cache pour les ressources de caméra
  {
    urlPattern: /^blob:.*/i,
    handler: 'NetworkOnly',
    options: {
      cacheName: 'camera-resources',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  }],
  // Configuration du manifeste
  additionalManifestEntries: [
    {
      url: '/',
      revision: '1',
    },
  ],
  // Fallbacks pour PWA
  fallbacks: {
    document: '/offline',
  },
};

const config = withPWA(pwaOptions)(nextConfig);
export default config;