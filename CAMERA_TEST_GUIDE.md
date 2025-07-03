# Guide de Test Caméra - AccessTicket

## 🎯 Objectif
Vérifier que la caméra fonctionne correctement sur mobile et peut scanner des QR codes.

## 📱 Test Actuel

### Version de Test
- **Caméra réelle** : ✅ Activée
- **Détection QR** : 🔄 Simulation (3 secondes)
- **Permissions** : ✅ Gérées
- **Erreurs** : ✅ Affichées clairement

### Comment Tester

1. **Accédez à la page scan-entry** sur votre mobile
2. **Cliquez sur "Démarrer le scanner"**
3. **Autorisez l'accès à la caméra** quand demandé
4. **Vérifiez que la caméra s'active** (vous devriez voir l'image de la caméra)
5. **Attendez 3 secondes** - un QR code de test sera automatiquement détecté
6. **Vérifiez le résultat** - vous devriez voir "ACCÈS AUTORISÉ" avec un code de test

## 🔍 Ce que vous devriez voir

### ✅ Succès
```
- Caméra s'active et affiche l'image
- Zone de scan avec cadre blanc
- Après 3s: "QR Code de test détecté: TEST-XXXXXX"
- Résultat: "ACCÈS AUTORISÉ - Billet: TEST-XXXXXX"
```

### ❌ Problèmes Possibles

#### 1. Caméra ne s'active pas
**Symptômes :**
- Écran noir ou gris
- Message d'erreur "Accès à la caméra refusé"

**Solutions :**
- Vérifiez les permissions du navigateur
- Utilisez Safari sur iOS
- Rechargez la page
- Vérifiez que vous êtes en HTTPS

#### 2. Erreur "Aucune caméra trouvée"
**Symptômes :**
- Message d'erreur "Aucune caméra trouvée"

**Solutions :**
- Vérifiez que votre appareil a une caméra
- Testez sur un autre appareil
- Utilisez un navigateur différent

#### 3. Erreur "Navigateur non supporté"
**Symptômes :**
- Message d'erreur "Votre navigateur ne supporte pas l'accès à la caméra"

**Solutions :**
- Utilisez Chrome sur Android
- Utilisez Safari sur iOS
- Mettez à jour votre navigateur

## 📋 Checklist de Test

### Test de Base
- [ ] Page se charge sans erreur
- [ ] Bouton "Démarrer le scanner" visible
- [ ] Clic sur le bouton demande les permissions
- [ ] Caméra s'active après autorisation
- [ ] Image de la caméra visible
- [ ] Zone de scan avec cadre visible
- [ ] QR code de test détecté après 3s
- [ ] Résultat affiché correctement

### Test d'Erreur
- [ ] Refuser les permissions → Message d'erreur affiché
- [ ] Bouton "Réessayer" fonctionne
- [ ] Bouton "Annuler" arrête le scanner

### Test de Performance
- [ ] Temps de chargement < 3 secondes
- [ ] Pas d'erreurs dans la console
- [ ] Interface responsive sur mobile

## 🛠️ Prochaines Étapes

### Phase 1 : Test de Base (Actuelle)
- ✅ Caméra s'active
- ✅ Permissions gérées
- ✅ Erreurs affichées
- 🔄 Simulation QR code

### Phase 2 : Détection Réelle
- [ ] Intégration bibliothèque QR scanner
- [ ] Test avec vrais QR codes
- [ ] Optimisation performance

### Phase 3 : Fonctionnalités Avancées
- [ ] Flash/torche
- [ ] Zoom
- [ ] Changement de caméra
- [ ] Historique des scans

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez la console** du navigateur mobile
2. **Testez sur différents appareils**
3. **Vérifiez les permissions**
4. **Utilisez HTTPS**

### Logs Utiles
```javascript
// Dans la console mobile, vous devriez voir :
"Initialisation de la caméra..."
"QR Code de test détecté: TEST-XXXXXX"
"QR Code scanned: TEST-XXXXXX"
```

## 🎯 Résultat Attendu

Après un test réussi, vous devriez voir :
1. **Caméra active** avec image en temps réel
2. **Zone de scan** avec cadre blanc
3. **Détection automatique** après 3 secondes
4. **Résultat de validation** avec code de test
5. **Interface responsive** et fluide

Cela confirme que la caméra fonctionne et que l'application est prête pour la détection de vrais QR codes ! 