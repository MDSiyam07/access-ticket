# Guide de Migration vers next-pwa

## 🎯 Pourquoi migrer vers next-pwa ?

### Problèmes de l'implémentation actuelle :
- ❌ Cache manuel et basique
- ❌ Pas d'optimisations automatiques
- ❌ Maintenance manuelle du Service Worker
- ❌ Pas de fallbacks avancés
- ❌ Pas de cache intelligent

### Avantages de next-pwa :
- ✅ Cache intelligent et automatique
- ✅ Optimisations de performance
- ✅ Fallbacks robustes
- ✅ Configuration simple
- ✅ Maintenance automatique
- ✅ Compatibilité Next.js 15

## 📦 Installation

```bash
npm install next-pwa
```

## ⚙️ Configuration

### 1. Mettre à jour next.config.ts
```typescript
import type { NextConfig } from "next";
import withPWA from 'next-pwa';

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
        ],
      },
    ];
  },
};

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'imageCache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'staticCache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 heures
        },
      },
    },
  ],
})(nextConfig);

export default config;
```

### 2. Supprimer les fichiers manuels
```bash
rm public/sw.js
rm components/ServiceWorkerRegistration.tsx
```

### 3. Mettre à jour layout.tsx
```typescript
// Supprimer l'import
// import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

// Supprimer du JSX
// <ServiceWorkerRegistration />
```

### 4. Améliorer le manifest.json
```json
{
  "name": "Festival Access Ticket",
  "short_name": "AccessTicket",
  "description": "Système de contrôle d'accès professionnel pour événements",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "fr",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshot-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "permissions": [
    "camera",
    "geolocation"
  ],
  "features": [
    "Cross Platform",
    "fast",
    "simple"
  ],
  "shortcuts": [
    {
      "name": "Scan Entry",
      "short_name": "Entry",
      "description": "Scanner les billets d'entrée",
      "url": "/scan-entry",
      "icons": [
        {
          "src": "/icon-192x192.png",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "Scan Exit",
      "short_name": "Exit",
      "description": "Scanner les billets de sortie",
      "url": "/scan-exit",
      "icons": [
        {
          "src": "/icon-192x192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

## 🚀 Fonctionnalités Avancées

### 1. Cache Intelligent
- **NetworkFirst** : Pour les requêtes API
- **CacheFirst** : Pour les images
- **StaleWhileRevalidate** : Pour les assets statiques

### 2. Offline Support
- Pages mises en cache automatiquement
- Fallback vers la page d'accueil
- Messages d'erreur personnalisés

### 3. Performance
- Préchargement des ressources
- Compression automatique
- Optimisation des images

### 4. Installation
- Prompt d'installation amélioré
- Raccourcis sur l'écran d'accueil
- Métadonnées riches

## 📱 Test de la PWA

### Lighthouse Score
```bash
# Installer Lighthouse
npm install -g lighthouse

# Tester la PWA
lighthouse https://your-domain.vercel.app --view
```

### Métriques Attendues
- **PWA Score** : 90+
- **Performance** : 90+
- **Accessibility** : 90+
- **Best Practices** : 90+
- **SEO** : 90+

## 🔧 Configuration Avancée

### Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_PWA_NAME=AccessTicket
NEXT_PUBLIC_PWA_DESCRIPTION=Système de contrôle d'accès
```

### Cache personnalisé
```typescript
// next.config.ts
runtimeCaching: [
  {
    urlPattern: /^https:\/\/api\./,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'apiCache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      },
    },
  },
]
```

## 🎯 Avantages de la Migration

### Pour les utilisateurs :
- ✅ Chargement plus rapide
- ✅ Fonctionnement hors ligne
- ✅ Installation facile
- ✅ Expérience native

### Pour les développeurs :
- ✅ Moins de code à maintenir
- ✅ Optimisations automatiques
- ✅ Configuration simple
- ✅ Compatibilité garantie

## 📋 Checklist de Migration

- [ ] Installer next-pwa
- [ ] Configurer next.config.ts
- [ ] Supprimer sw.js manuel
- [ ] Supprimer ServiceWorkerRegistration
- [ ] Mettre à jour manifest.json
- [ ] Tester en développement
- [ ] Tester en production
- [ ] Vérifier Lighthouse score
- [ ] Tester l'installation PWA
- [ ] Tester le fonctionnement hors ligne

Cette migration améliorera significativement l'expérience PWA de votre application ! 