# Guide Administrateur - AccessTicket

## 🛡️ Système de Sécurité Implémenté

### Comptes Disponibles

#### 👑 Administrateur
- **Email** : `admin@festival.com`
- **Mot de passe** : `admin123`
- **Accès** : Toutes les fonctionnalités
  - ✅ Import de tickets
  - ✅ Statistiques avancées
  - ✅ Historique complet
  - ✅ Administration
  - ✅ Scan d'entrée/sortie
  - ✅ Saisie manuelle

#### 👤 Utilisateur Standard
- **Email** : `user@festival.com`
- **Mot de passe** : `user123`
- **Accès** : Fonctionnalités limitées
  - ✅ Scan d'entrée
  - ✅ Scan de sortie
  - ✅ Statistiques de base
  - ❌ Import de tickets
  - ❌ Historique
  - ❌ Administration

## 🔐 Fonctionnalités de Sécurité

### Protection des Routes
- **Middleware Next.js** : Vérification automatique des permissions
- **Composants de protection** : `AdminRoute`, `UserRoute`, `ScanRoute`
- **Redirection automatique** : En cas d'accès non autorisé

### Interface Sécurisée
- **Navigation adaptative** : Menu différent selon le rôle
- **Badges visuels** : Indicateurs de mode admin/utilisateur
- **Masquage des fonctionnalités** : Seules les options autorisées sont visibles

### Validation des Permissions
- **Côté client** : Vérification dans les composants React
- **Côté serveur** : Middleware de protection
- **Stockage sécurisé** : Vérification de l'intégrité des données

## 🚀 Utilisation

### 1. Connexion
1. Aller sur `/login`
2. Choisir le type de compte (Admin ou Utilisateur)
3. Les identifiants se remplissent automatiquement
4. Cliquer sur "Se connecter"

### 2. Espace Administrateur
- **URL** : `/admin`
- **Accès** : Admin uniquement
- **Fonctionnalités** :
  - Import de fichiers CSV
  - Statistiques détaillées
  - Gestion complète du système

### 3. Espace Utilisateur
- **URL** : `/dashboard`
- **Accès** : Tous les utilisateurs authentifiés
- **Fonctionnalités** : Selon le rôle

### 4. Pages de Scan
- **Scan Entrée** : `/scan-entry`
- **Scan Sortie** : `/scan-exit`
- **Accès** : Tous les utilisateurs authentifiés

## 🔧 Configuration

### Ajouter un Nouvel Utilisateur
1. Modifier `app/contexts/AuthContext.tsx`
2. Ajouter dans l'objet `USERS` :
```typescript
'nouveau@email.com': {
  id: '3',
  email: 'nouveau@email.com',
  name: 'Nouvel Utilisateur',
  role: 'user', // ou 'admin'
  password: 'motdepasse123'
}
```

### Modifier les Permissions
1. Ajuster les routes dans `middleware.ts`
2. Modifier les composants de protection
3. Mettre à jour la navigation dans `components/Navbar.tsx`

### Personnaliser l'Interface
- **Badges admin** : Modifier les couleurs dans les composants
- **Messages d'erreur** : Personnaliser dans `AdminRoute.tsx` et `UserRoute.tsx`
- **Navigation** : Ajuster dans `components/Navbar.tsx`

## 🛠️ Maintenance

### Vérification de Sécurité
1. **Tester les redirections** :
   - Utilisateur standard → `/admin` → redirection vers `/dashboard`
   - Admin → pages utilisateur → redirection vers `/admin`
   - Non authentifié → pages protégées → redirection vers `/login`

2. **Vérifier les permissions** :
   - Menu adaptatif selon le rôle
   - Fonctionnalités masquées pour les utilisateurs non autorisés
   - Badges visuels corrects

3. **Tester la persistance** :
   - Connexion/déconnexion
   - Rechargement de page
   - Données corrompues dans localStorage

### Logs et Monitoring
- **Console du navigateur** : Vérifier les erreurs de sécurité
- **Network tab** : Surveiller les requêtes non autorisées
- **LocalStorage** : Vérifier l'intégrité des données utilisateur

## 🚨 Sécurité en Production

### Recommandations Critiques
1. **Remplacer les mots de passe en dur** par une base de données
2. **Implémenter JWT** pour l'authentification
3. **Ajouter HTTPS** en production
4. **Configurer les en-têtes de sécurité**
5. **Implémenter la journalisation des accès**

### Variables d'Environnement
```env
# À configurer en production
JWT_SECRET=votre_secret_jwt
DATABASE_URL=votre_url_base_de_donnees
NEXTAUTH_SECRET=votre_secret_nextauth
```

## 📞 Support

En cas de problème :
1. Vérifier les logs dans la console du navigateur
2. Tester avec les comptes de démonstration
3. Vérifier la configuration du middleware
4. Consulter le fichier `SECURITY.md` pour plus de détails

---

**⚠️ Important** : Ce système est conçu pour la démonstration. Pour la production, implémentez toutes les recommandations de sécurité mentionnées dans `SECURITY.md`. 