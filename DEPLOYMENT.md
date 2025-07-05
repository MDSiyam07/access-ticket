# Guide de Déploiement Vercel

## Configuration Requise

### Variables d'Environnement

Ajoutez ces variables dans votre projet Vercel :

```bash
DATABASE_URL="postgresql://username:password@host:5432/database_name"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Base de Données

1. **Créer une base PostgreSQL** (Vercel Postgres, Supabase, etc.)
2. **Exécuter les migrations** :
   ```bash
   npx prisma db push
   ```

### Build Configuration

Le projet est configuré pour :
- Générer automatiquement le client Prisma lors du build
- Utiliser les chemins d'import corrects pour Vercel
- Gérer les types TypeScript

## Déploiement

1. **Connecter le repository** à Vercel
2. **Configurer les variables d'environnement**
3. **Déployer** - Le build inclura automatiquement la génération Prisma

## Résolution des Problèmes

### Erreur "Module not found: Can't resolve '../../../../lib/generated/prisma'"

**Solution** : Le client Prisma doit être généré avant le build.

**Vérifications** :
- ✅ Script `postinstall` ajouté au package.json
- ✅ Script `build` inclut `prisma generate`
- ✅ Configuration vercel.json mise à jour

### Erreur de Base de Données

**Vérifications** :
- ✅ Variable `DATABASE_URL` configurée
- ✅ Base de données accessible depuis Vercel
- ✅ Migrations exécutées

## Structure des Fichiers

```
access-ticket/
├── app/
│   ├── api/
│   │   └── tickets/
│   │       ├── import/route.ts
│   │       ├── scan/route.ts
│   │       ├── stats/route.ts
│   │       └── activity/route.ts
│   └── admin/page.tsx
├── components/
│   ├── TicketImport.tsx
│   └── ImportStats.tsx
├── lib/generated/prisma/  # Généré automatiquement
├── prisma/
│   └── schema.prisma
├── types/
│   └── global.d.ts
├── package.json
├── vercel.json
└── tsconfig.json
``` 