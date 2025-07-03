# Guide de Test - Festival Access Ticket

## 📱 Test de Compatibilité PWA

### **Android (Recommandé)**
- ✅ **Support complet** : Chrome, Firefox, Edge
- ✅ **Installation facile** : Prompt automatique
- ✅ **Permissions étendues** : Caméra, notifications
- ✅ **Performance native** : Très proche d'une app native

**Comment tester :**
1. Ouvrez Chrome sur Android
2. Allez sur votre app
3. Vous devriez voir un prompt d'installation
4. Installez l'app
5. Testez le scanner QR - devrait fonctionner parfaitement

### **iOS (Safari uniquement)**
- ⚠️ **Safari uniquement** : Chrome/Firefox ont des limitations
- ⚠️ **Permissions limitées** : Restrictions Apple
- ✅ **Installation manuelle** : Via menu Partager

**Comment tester :**
1. Ouvrez Safari sur iPhone/iPad
2. Allez sur votre app
3. Cliquez sur le bouton "Partager" (carré avec flèche)
4. Sélectionnez "Sur l'écran d'accueil"
5. Testez le scanner QR

## 🔧 Résolution des Problèmes iOS

### **Erreur "Camera streaming not supported"**

**Cause :** Safari iOS a des restrictions sur l'accès caméra en mode web.

**Solutions :**

1. **Installer l'app PWA** (Recommandé)
   - Utilisez Safari
   - Cliquez sur "Partager" → "Sur l'écran d'accueil"
   - Lancez l'app depuis l'écran d'accueil
   - Les permissions caméra sont meilleures

2. **Utiliser l'option "Sélectionner une image"**
   - Si la caméra ne fonctionne pas
   - Prenez une photo du QR code
   - Sélectionnez l'image dans l'app

3. **Vérifier les permissions**
   - Réglages → Safari → Caméra → Autoriser
   - Réglages → Confidentialité → Caméra → Safari

## 🧪 Tests à Effectuer

### **Test 1 : Détection d'appareil**
- [ ] Page d'accueil affiche les bonnes informations
- [ ] Composant DeviceInfo fonctionne
- [ ] Détection iOS/Android correcte

### **Test 2 : Scanner QR (Android)**
- [ ] Scanner démarre sans erreur
- [ ] Caméra s'ouvre correctement
- [ ] QR code détecté et traité
- [ ] Redirection après scan

### **Test 3 : Scanner QR (iOS)**
- [ ] Scanner iOS spécialisé se lance
- [ ] Option "Sélectionner une image" disponible
- [ ] Scan d'image fonctionne
- [ ] Messages d'erreur informatifs

### **Test 4 : PWA Installation**
- [ ] Prompt d'installation apparaît
- [ ] Installation réussie
- [ ] App fonctionne en mode standalone
- [ ] Icône sur l'écran d'accueil

### **Test 5 : Navigation**
- [ ] Toutes les pages accessibles
- [ ] Authentification fonctionne
- [ ] Historique des scans
- [ ] Interface responsive

## 📊 Comparaison Android vs iOS

| Fonctionnalité | Android | iOS |
|---|---|---|
| **PWA Installation** | ✅ Automatique | ⚠️ Manuel |
| **Caméra Directe** | ✅ Parfait | ⚠️ Limité |
| **Permissions** | ✅ Étendues | ⚠️ Restrictives |
| **Performance** | ✅ Excellente | ✅ Bonne |
| **Navigateurs** | ✅ Tous | ⚠️ Safari uniquement |

## 🚀 Optimisations Recommandées

### **Pour Android :**
- ✅ Déjà optimal
- ✅ Support complet
- ✅ Performance native

### **Pour iOS :**
- ✅ Scanner iOS spécialisé
- ✅ Option upload d'image
- ✅ Messages d'aide contextuels
- ✅ Détection PWA

## 🔍 Debug

### **Console Logs à Vérifier :**
```javascript
// Détection d'appareil
Device detection: { isMobile: true, isIOS: true, userAgent: "..." }

// Scanner iOS
IOSQRScanner - Starting initialization...
IOSQRScanner - Trying camera config: { facingMode: "environment" }
IOSQRScanner - QR Code scanned: [data]

// Scanner Android
QRCodeScanner - Starting scanner initialization...
QRCodeScanner - Scanner rendered successfully
```

### **Erreurs Courantes :**
1. **"Camera streaming not supported"** → Utiliser l'option image sur iOS
2. **"NotAllowedError"** → Vérifier les permissions caméra
3. **"NotFoundError"** → Aucune caméra disponible

## 📱 Conseils Utilisateur

### **Pour les utilisateurs Android :**
- Installez l'app pour une meilleure expérience
- Autorisez l'accès caméra quand demandé
- Utilisez Chrome pour de meilleures performances

### **Pour les utilisateurs iOS :**
- Utilisez Safari (pas Chrome/Firefox)
- Installez l'app sur l'écran d'accueil
- Si la caméra ne fonctionne pas, utilisez l'option "Sélectionner une image"
- Autorisez l'accès caméra dans les réglages

---

**Note :** Cette app est optimisée pour fonctionner sur tous les appareils, avec des solutions de fallback pour iOS où les restrictions sont plus strictes. 