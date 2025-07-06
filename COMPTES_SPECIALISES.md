# Comptes Utilisateurs Spécialisés - AccessTicket

## Vue d'ensemble

Le système AccessTicket dispose maintenant de comptes utilisateurs spécialisés pour gérer différents aspects du contrôle d'accès lors d'un événement. Chaque compte a des permissions spécifiques et un accès limité aux fonctionnalités appropriées.

## Types de Comptes

### 1. Administrateur (`admin@festival.com`)
- **Mot de passe**: `admin123`
- **Rôle**: Accès complet au système
- **Permissions**:
  - Import de billets
  - Consultation des statistiques
  - Accès à l'historique complet
  - Saisie manuelle de billets
  - Administration du système
  - Scan d'entrée et de sortie

### 2. Contrôleur Entrées (`entry@festival.com`)
- **Mot de passe**: `entry123`
- **Rôle**: Gestion des entrées uniquement
- **Permissions**:
  - Scan d'entrée des billets
  - Consultation des statistiques d'entrée
  - Accès limité au tableau de bord

### 3. Contrôleur Sorties (`exit@festival.com`)
- **Mot de passe**: `exit123`
- **Rôle**: Gestion des sorties uniquement
- **Permissions**:
  - Scan de sortie des billets
  - Consultation des statistiques de sortie
  - Accès limité au tableau de bord

### 4. Contrôleur Ré-entrées (`reentry@festival.com`)
- **Mot de passe**: `reentry123`
- **Rôle**: Gestion des sorties et ré-entrées
- **Permissions**:
  - Scan de sortie des billets
  - Scan d'entrée pour les ré-entrées
  - Consultation des statistiques
  - Accès au tableau de bord

## Avantages du Système Spécialisé

### Sécurité
- **Séparation des responsabilités**: Chaque contrôleur ne peut accéder qu'aux fonctionnalités nécessaires
- **Traçabilité**: Actions clairement attribuées à chaque type de compte
- **Réduction des erreurs**: Interface simplifiée selon le rôle

### Efficacité Opérationnelle
- **Interface adaptée**: Navigation et options personnalisées selon le rôle
- **Formation simplifiée**: Chaque contrôleur apprend uniquement ses fonctions
- **Déploiement flexible**: Possibilité d'avoir plusieurs postes spécialisés

### Gestion d'Événement
- **Contrôle d'accès**: Entrées et sorties gérées séparément
- **Gestion des ré-entrées**: Compte dédié pour les personnes qui sortent et rentrent
- **Administration centralisée**: Superviseur avec accès complet

## Utilisation Recommandée

### Pour un Festival/Événement

1. **Poste d'entrée principal**:
   - Compte: `entry@festival.com`
   - Fonction: Valider les entrées des visiteurs

2. **Poste de sortie**:
   - Compte: `exit@festival.com`
   - Fonction: Enregistrer les sorties

3. **Poste de ré-entrée**:
   - Compte: `reentry@festival.com`
   - Fonction: Gérer les sorties temporaires et ré-entrées

4. **Poste d'administration**:
   - Compte: `admin@festival.com`
   - Fonction: Supervision et gestion globale

### Workflow Typique

1. **Entrée**: Le contrôleur d'entrée scanne les billets des visiteurs qui arrivent
2. **Sortie temporaire**: Le contrôleur de sortie enregistre les sorties temporaires
3. **Ré-entrée**: Le contrôleur ré-entrée gère le retour des visiteurs
4. **Sortie définitive**: Le contrôleur de sortie enregistre les sorties finales

## Configuration

### Base de Données
Le système utilise Prisma avec les rôles suivants:
- `ADMIN`: Accès complet
- `ENTRY`: Contrôleur d'entrée
- `EXIT`: Contrôleur de sortie
- `REENTRY`: Contrôleur de ré-entrée

### Interface Utilisateur
- **Navigation adaptée**: Menu personnalisé selon le rôle
- **Couleurs distinctives**: Chaque rôle a sa couleur d'identification
- **Messages contextuels**: Interface adaptée aux besoins de chaque rôle

## Sécurité

### Bonnes Pratiques
- Changer les mots de passe par défaut en production
- Utiliser des mots de passe forts
- Limiter l'accès physique aux postes selon les rôles
- Former les utilisateurs sur leurs responsabilités spécifiques

### Monitoring
- Toutes les actions sont tracées dans l'historique
- Les tentatives d'accès non autorisées sont enregistrées
- Les statistiques permettent de surveiller l'activité

## Support

Pour toute question concernant les comptes spécialisés, contactez l'équipe technique ou consultez la documentation complète du système AccessTicket. 