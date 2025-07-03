# Guide de Dépannage Mobile - AccessTicket

## Problèmes Courants et Solutions

### 1. Erreur "Application error: a client-side exception has occurred"

**Causes possibles :**
- Variables CSS OKLCH non supportées par certains navigateurs mobiles
- Problèmes de compatibilité avec les composants QR Scanner
- Erreurs de hydration Next.js

**Solutions appliquées :**
- ✅ Remplacement des variables CSS OKLCH par des couleurs hexadécimales
- ✅ Amélioration de la configuration Next.js
- ✅ Ajout d'un ErrorBoundary pour capturer les erreurs
- ✅ Amélioration de la gestion d'erreur dans les composants QR Scanner

### 2. Problèmes de Caméra sur Mobile

**iOS Safari :**
- Utilisez Safari (pas Chrome/Firefox)
- Autorisez l'accès à la caméra quand demandé
- Installez l'app sur l'écran d'accueil pour de meilleures permissions

**Android :**
- Utilisez Chrome ou Firefox
- Autorisez l'accès à la caméra
- Installez l'app pour une meilleure expérience

### 3. Problèmes de Performance

**Solutions :**
- ✅ Optimisation des imports de packages
- ✅ Configuration webpack pour mobile
- ✅ Gestion d'erreur améliorée

### 4. Problèmes de PWA

**Vérifications :**
- L'application doit être servie en HTTPS
- Le manifest.json doit être correctement configuré
- Le service worker doit être enregistré

## Configuration Recommandée

### Variables d'Environnement
```bash
NEXT_PUBLIC_APP_NAME=AccessTicket
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_CAMERA=true
```

### Configuration Next.js
- Optimisation des imports
- Configuration webpack pour mobile
- Headers de sécurité
- Gestion des erreurs

### Configuration TypeScript
- Target ES2020 pour une meilleure compatibilité
- Règles de linting assouplies pour le développement

## Tests Recommandés

### Avant Déploiement
1. Test sur iOS Safari
2. Test sur Android Chrome
3. Test en mode PWA
4. Test de la caméra
5. Test hors ligne

### Outils de Test
- Chrome DevTools (mode mobile)
- Safari Web Inspector (iOS)
- Lighthouse (PWA score)
- WebPageTest (performance mobile)

## Déploiement Vercel

### Configuration Recommandée
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Variables d'Environnement Vercel
- `NODE_ENV=production`
- `NEXT_PUBLIC_ENABLE_PWA=true`
- `NEXT_PUBLIC_ENABLE_CAMERA=true`

## Monitoring et Debugging

### Logs à Surveiller
- Erreurs de console côté client
- Erreurs de build
- Problèmes de performance
- Erreurs de caméra

### Outils de Debugging
- Sentry (pour les erreurs)
- Vercel Analytics
- Console du navigateur mobile
- Network tab pour les requêtes

## Contact et Support

En cas de problème persistant :
1. Vérifiez les logs de la console mobile
2. Testez sur différents appareils
3. Vérifiez la configuration Vercel
4. Consultez les métriques de performance 