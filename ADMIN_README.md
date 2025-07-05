# Page d'Administration - Import de Tickets

## Accès

La page d'administration est accessible via le menu de navigation en se connectant avec les identifiants admin :
- **Email** : `admin@festival.com`
- **Mot de passe** : `admin123`

## Fonctionnalités

### 1. Import de Fichiers

La page permet d'importer des tickets depuis des fichiers CSV ou Excel (.xlsx, .xls).

#### Formats de fichiers supportés :
- **CSV** : Fichiers avec séparateur virgule
- **Excel** : Fichiers .xlsx et .xls

#### Colonnes requises :
Le fichier doit contenir une colonne avec l'un de ces noms (insensible à la casse) :
- `number`
- `numero`
- `ticket`

#### Exemple de fichier CSV :
```csv
number,name,email
TICKET001,John Doe,john@example.com
TICKET002,Jane Smith,jane@example.com
```

### 2. Gestion des Doublons

- Les tickets déjà existants dans la base de données sont automatiquement ignorés
- Seuls les nouveaux tickets sont importés avec le statut `PENDING`

### 3. Statistiques en Temps Réel

La page affiche les statistiques actuelles :
- **Total Tickets** : Nombre total de tickets dans la base
- **En Attente** : Tickets importés mais non utilisés
- **Entrés** : Tickets validés en entrée
- **Sortis** : Tickets validés en sortie

### 4. Logique de Ré-entrée

Le système gère automatiquement la ré-entrée des tickets :
- Un ticket avec le statut `EXITED` peut ré-entrer
- Un ticket avec le statut `ENTERED` ne peut pas entrer à nouveau
- Un ticket avec le statut `PENDING` ne peut pas sortir

## Routes API

### `/api/tickets/import` (POST)
Importe une liste de numéros de tickets.

**Body :**
```json
{
  "tickets": ["TICKET001", "TICKET002", "TICKET003"]
}
```

**Response :**
```json
{
  "success": true,
  "imported": 2,
  "duplicates": 1,
  "total": 3
}
```

### `/api/tickets/scan` (POST)
Valide l'entrée ou la sortie d'un ticket.

**Body :**
```json
{
  "ticketNumber": "TICKET001",
  "action": "ENTER",
  "entryType": "SCAN"
}
```

**Actions possibles :**
- `ENTER` : Valider l'entrée
- `EXIT` : Valider la sortie

### `/api/tickets/stats` (GET)
Récupère les statistiques des tickets.

**Response :**
```json
{
  "total": 100,
  "pending": 50,
  "entered": 30,
  "exited": 20,
  "imported": 100,
  "duplicates": 0
}
```

## Sécurité

- La page est protégée par l'authentification
- Seuls les utilisateurs connectés peuvent accéder à l'administration
- Redirection automatique vers la page de connexion si non authentifié

## Utilisation

1. Connectez-vous avec les identifiants admin
2. Cliquez sur "Administration" dans le menu
3. Glissez-déposez ou sélectionnez un fichier CSV/Excel
4. Le système traite automatiquement le fichier
5. Consultez les statistiques pour vérifier l'import

## Gestion des Erreurs

- **Fichier invalide** : Message d'erreur explicite
- **Aucun ticket trouvé** : Vérification de la colonne "number"
- **Erreur réseau** : Retry automatique
- **Doublons** : Affichage du nombre de tickets ignorés 