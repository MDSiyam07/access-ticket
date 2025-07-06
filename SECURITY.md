# Sécurité du Système AccessTicket

## Vue d'ensemble

Le système AccessTicket implémente un système de sécurité robuste avec des rôles différenciés pour garantir que seuls les utilisateurs autorisés peuvent accéder aux fonctionnalités appropriées.

## Architecture de Sécurité

### 1. Système d'Authentification

#### Comptes Utilisateurs
- **Administrateur** : `admin@festival.com` / `admin123`
  - Accès complet à toutes les fonctionnalités
  - Import de tickets
  - Statistiques avancées
  - Historique complet
  - Administration du système

- **Utilisateur Standard** : `user@festival.com` / `user123`
  - Accès limité aux fonctionnalités de scan
  - Scan d'entrée et de sortie uniquement
  - Vue simplifiée des statistiques

### 2. Protection des Routes

#### Routes Protégées
- `/dashboard` - Tableau de bord (accessible à tous les utilisateurs authentifiés)
- `/admin` - Espace administration (admin uniquement)
- `/scan-entry` - Scan d'entrée (tous les utilisateurs)
- `/scan-exit` - Scan de sortie (tous les utilisateurs)
- `/history` - Historique (admin uniquement)
- `/manual-entry` - Saisie manuelle (admin uniquement)

#### Middleware de Sécurité
Le middleware Next.js vérifie automatiquement :
- L'authentification pour toutes les routes protégées
- Les permissions admin pour les routes sensibles
- Redirection automatique vers la page de login si non authentifié

### 3. Composants de Protection

#### AdminRoute
- Vérifie que l'utilisateur est authentifié ET administrateur
- Redirige vers `/login` si non authentifié
- Redirige vers `/dashboard` si authentifié mais non admin
- Affiche une page d'erreur personnalisée

#### UserRoute
- Vérifie que l'utilisateur est authentifié mais PAS admin
- Redirige vers `/admin` si l'utilisateur est admin
- Utilisé pour les pages réservées aux utilisateurs standard

#### ScanRoute
- Vérifie uniquement l'authentification
- Accessible aux deux types d'utilisateurs
- Utilisé pour les pages de scan

### 4. Interface Utilisateur Sécurisée

#### Navigation Adaptative
- Menu différent selon le rôle de l'utilisateur
- Badge "Admin" visible pour les administrateurs
- Masquage des fonctionnalités non autorisées

#### Indicateurs Visuels
- Badge rouge "Mode Administrateur" pour les admins
- Badge bleu "Mode Utilisateur" pour les utilisateurs standard
- Icônes de bouclier pour les fonctionnalités admin

### 5. Sécurité des Données

#### Stockage Local
- Informations utilisateur stockées dans localStorage
- Vérification de la validité des données au chargement
- Nettoyage automatique des données corrompues

#### Validation des Permissions
- Vérification côté client ET serveur
- Protection contre les tentatives d'accès direct aux URLs
- Redirection automatique en cas d'accès non autorisé

## Recommandations de Production

### 1. Authentification
- Remplacer le système de mots de passe en dur par une base de données
- Implémenter le hachage bcrypt pour les mots de passe
- Ajouter l'authentification JWT avec tokens sécurisés

### 2. Base de Données
- Stocker les utilisateurs dans une base de données sécurisée
- Implémenter des sessions avec expiration
- Ajouter la journalisation des accès

### 3. API Sécurisée
- Protéger toutes les routes API avec authentification
- Implémenter la validation des rôles côté serveur
- Ajouter la limitation de taux (rate limiting)

### 4. Environnement
- Utiliser des variables d'environnement pour les secrets
- Implémenter HTTPS en production
- Configurer les en-têtes de sécurité appropriés

## Tests de Sécurité

### Scénarios Testés
1. **Accès non authentifié** : Redirection vers `/login`
2. **Utilisateur standard tentant d'accéder à `/admin`** : Redirection vers `/dashboard`
3. **Admin tentant d'accéder aux pages utilisateur** : Redirection vers `/admin`
4. **Accès direct aux URLs protégées** : Protection par middleware
5. **Données corrompues dans localStorage** : Nettoyage automatique

### Points de Contrôle
- ✅ Authentification requise pour toutes les routes protégées
- ✅ Séparation claire des rôles admin/user
- ✅ Interface adaptative selon les permissions
- ✅ Protection contre les accès directs
- ✅ Redirection automatique en cas d'accès non autorisé
- ✅ Indicateurs visuels de sécurité

## Maintenance

### Mise à Jour des Permissions
1. Modifier la configuration des utilisateurs dans `AuthContext.tsx`
2. Mettre à jour les routes protégées dans `middleware.ts`
3. Ajuster les composants de protection si nécessaire
4. Tester tous les scénarios d'accès

### Ajout de Nouveaux Rôles
1. Étendre l'interface `User` avec le nouveau rôle
2. Ajouter la logique de vérification dans les composants
3. Mettre à jour la navigation et l'interface
4. Tester les nouvelles permissions 