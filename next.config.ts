// import type { NextConfig } from "next";
// import withPWA from '@ducanh2912/next-pwa';

// interface PWAPluginOptions {
//   dest: string;
//   register: boolean;
//   disable: boolean;
//   runtimeCaching?: Array<{
//     urlPattern: RegExp;
//     handler: string;
//     options: {
//       cacheName: string;
//       expiration: {
//         maxEntries: number;
//         maxAgeSeconds: number;
//       };
//       cacheableResponse: {
//         statuses: number[];
//       };
//     };
//   }>;
//   additionalManifestEntries?: Array<{
//     url: string;
//     revision: string;
//   }>;
//   fallbacks?: {
//     document: string;
//   };
// }

// const nextConfig: NextConfig = {
//   experimental: {
//     optimizePackageImports: ['lucide-react', 'html5-qrcode'],
//   },
//   compiler: {
//     removeConsole: process.env.NODE_ENV === 'production',
//   },
//   images: {
//     domains: [],
//     unoptimized: true,
//   },
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }
//     return config;
//   },
//   headers: async () => {
//     return [
//       // Header pour les fichiers JS (doit être le premier !)
//       {
//         source: '/_next/static/(.*)\\.js',
//         headers: [
//           {
//             key: 'Content-Type',
//             value: 'application/javascript',
//           },
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=31536000, immutable',
//           },
//         ],
//       },
//       // Header pour les fichiers WASM
//       {
//         source: '/(.*)\\.wasm',
//         headers: [
//           {
//             key: 'Content-Type',
//             value: 'application/wasm',
//           },
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=31536000, immutable',
//           },
//         ],
//       },
//       // Header global (doit venir après)
//       {
//         source: '/(.*)',
//         headers: [
//           {
//             key: 'X-Frame-Options',
//             value: 'DENY',
//           },
//           {
//             key: 'Referrer-Policy',
//             value: 'origin-when-cross-origin',
//           },
//           {
//             key: 'Permissions-Policy',
//             value: 'camera=*, microphone=*',
//           },
//           {
//             key: 'Content-Security-Policy',
//             value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: mediastream:; media-src 'self' blob: data: https: mediastream:; connect-src 'self' https: wss: ws:; font-src 'self' https:; worker-src 'self' blob:;",
//           },
//           // Headers COEP/COOP commentés pour compatibilité Safari
//           // {
//           //   key: 'Cross-Origin-Embedder-Policy',
//           //   value: 'credentialless',
//           // },
//           // {
//           //   key: 'Cross-Origin-Opener-Policy',
//           //   value: 'same-origin',
//           // },
//         ],
//       },
//     ];
//   },
// };

// const pwaOptions: PWAPluginOptions = {
//   dest: 'public',
//   register: true,
//   disable: process.env.NODE_ENV === 'development',
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
//       handler: 'CacheFirst',
//       options: {
//         cacheName: 'google-fonts-cache',
//         expiration: {
//           maxEntries: 10,
//           maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
//         },
//         cacheableResponse: {
//           statuses: [0, 200],
//         },
//       },
//     },
//     // Cache pour les pages principales
//     {
//       urlPattern: /^https:\/\/.*\.(js|css|html)$/,
//       handler: 'StaleWhileRevalidate',
//       options: {
//         cacheName: 'static-resources',
//         expiration: {
//           maxEntries: 50,
//           maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
//         },
//         cacheableResponse: {
//           statuses: [0, 200],
//         },
//       },
//     },
//   ],
//   additionalManifestEntries: [
//     {
//       url: '/',
//       revision: '1',
//     },
//   ],
//   fallbacks: {
//     document: '/offline',
//   },
// };

// const config = withPWA(pwaOptions)(nextConfig);
// export default config;

import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

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
  headers: async () => [
    // Pour les fichiers .wasm (WebAssembly)
    {
      source: '/_next/static/wasm/(.*)\\.wasm',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/wasm',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        // {
        //   key: 'X-Content-Type-Options',
        //   value: 'nosniff',
        // },
      ],
    },

    // Pour les chunks JS générés par Next
    {
      source: '/_next/static/(.*)\\.js',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/javascript',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        // {
        //   key: 'X-Content-Type-Options',
        //   value: 'nosniff',
        // },
      ],
    },
  ],
};

export default withPWA({
  dest: 'public',
  register: true,
})(nextConfig);
