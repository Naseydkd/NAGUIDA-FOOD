# 🔧 Dépannage : Erreur 401 - invalid_client

## ❌ Erreur rencontrée :
```
Accès bloqué : erreur d'autorisation
The OAuth client was not found.
Erreur 401 : invalid_client
```

## 🔍 Causes possibles :

### 1. Le projet Google Cloud n'existe pas ou a été supprimé
### 2. Les credentials (Client ID / Secret) sont incorrects
### 3. Le projet n'est pas configuré correctement
### 4. L'écran de consentement OAuth n'est pas configuré

---

## ✅ SOLUTION : Reconfigurer Google OAuth

### **Étape 1 : Vérifier/Créer un projet Google Cloud**

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Connectez-vous avec : `abdoulnasserseydou24@gmail.com`

**Option A : Vérifier le projet existant**
- Cliquez sur le sélecteur de projet (en haut)
- Cherchez "NAGUIDA FOOD" ou un projet similaire
- Si vous le trouvez, ouvrez-le et passez à l'Étape 2

**Option B : Créer un nouveau projet**
- Cliquez sur "Nouveau projet"
- Nom : `NAGUIDA FOOD`
- Cliquez sur "Créer"
- Attendez quelques secondes que le projet soit créé

---

### **Étape 2 : Activer l'API Google+ ou Google Identity**

1. Dans le menu de gauche : **"API et services" > "Bibliothèque"**
2. Recherchez : **"Google+ API"**
3. Cliquez dessus et cliquez sur **"Activer"**

---

### **Étape 3 : Configurer l'écran de consentement OAuth**

1. Menu de gauche : **"API et services" > "Écran de consentement OAuth"**
2. Type d'utilisateur : **"Externe"**
3. Cliquez sur **"Créer"**

**Remplissez les informations :**
- **Nom de l'application** : `NAGUIDA FOOD`
- **E-mail d'assistance utilisateur** : `abdoulnasserseydou24@gmail.com`
- **Logo** : (Optionnel)
- **Domaine de l'application** : (Laissez vide pour localhost)
- **E-mail du développeur** : `abdoulnasserseydou24@gmail.com`

4. Cliquez sur **"Enregistrer et continuer"**

**Champs d'application (Scopes) :**
5. Cliquez sur **"Ajouter ou supprimer des champs d'application"**
6. Cochez :
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Cliquez sur **"Mettre à jour"**
8. Cliquez sur **"Enregistrer et continuer"**

**Utilisateurs test :**
9. Ajoutez votre email : `abdoulnasserseydou24@gmail.com`
10. Cliquez sur **"Enregistrer et continuer"**

**Résumé :**
11. Vérifiez et cliquez sur **"Retour au tableau de bord"**

---

### **Étape 4 : Créer de NOUVEAUX identifiants OAuth**

1. Menu de gauche : **"API et services" > "Identifiants"**

2. **Supprimer les anciens identifiants (si présents) :**
   - Trouvez l'ancien "ID client OAuth 2.0"
   - Cliquez sur l'icône de corbeille pour le supprimer
   - Confirmez la suppression

3. **Créer de nouveaux identifiants :**
   - Cliquez sur **"+ Créer des identifiants"**
   - Sélectionnez **"ID client OAuth"**
   - Type d'application : **"Application Web"**
   - Nom : `NAGUIDA FOOD Web Client`

4. **Origines JavaScript autorisées :**
   ```
   http://localhost:3000
   ```

5. **URI de redirection autorisés :**
   ```
   http://localhost:3000/api/auth/google/callback
   ```

6. Cliquez sur **"Créer"**

7. **IMPORTANT : Une popup s'affiche avec :**
   - **ID client** : `xxxx-yyyy.apps.googleusercontent.com`
   - **Code secret du client** : `GOCSPX-xxxxxxxxxxxx`
   
   ⚠️ **COPIEZ CES VALEURS IMMÉDIATEMENT !**

---

### **Étape 5 : Mettre à jour le fichier `.env`**

Ouvrez `backend/.env` et remplacez les lignes suivantes avec vos **NOUVELLES** valeurs :

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=VOTRE_NOUVEAU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=VOTRE_NOUVEAU_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=naguida-food-session-secret-2026-secure
```

**⚠️ ATTENTION : Remplacez EXACTEMENT :**
- `VOTRE_NOUVEAU_CLIENT_ID` par l'ID client copié
- `VOTRE_NOUVEAU_CLIENT_SECRET` par le secret copié

---

### **Étape 6 : Redémarrer le serveur**

```bash
cd backend
npm start
```

---

### **Étape 7 : Tester à nouveau**

1. Ouvrez : `http://localhost:3000/index.html`
2. Cliquez sur "Connexion"
3. Cliquez sur "Se connecter avec Google"
4. Cette fois, ça devrait fonctionner ! ✅

---

## 🔍 **Comment vérifier que les credentials sont corrects ?**

Vos nouveaux credentials doivent ressembler à :

```
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxy
```

**Format attendu :**
- Client ID : Se termine par `.apps.googleusercontent.com`
- Client Secret : Commence par `GOCSPX-`

---

## ⚠️ **Erreurs courantes à éviter :**

1. ❌ **Espaces ou sauts de ligne dans les valeurs**
   ```env
   # MAUVAIS
   GOOGLE_CLIENT_ID=123456789012-abc.apps.googleusercontent.
   com
   
   # BON
   GOOGLE_CLIENT_ID=123456789012-abc.apps.googleusercontent.com
   ```

2. ❌ **Copier l'ancien Client ID au lieu du nouveau**
   - Assurez-vous de copier les credentials depuis la popup après création

3. ❌ **Oublier de redémarrer le serveur**
   - Les changements du `.env` nécessitent un redémarrage

4. ❌ **Mauvaise URL de callback**
   - Doit être EXACTEMENT : `http://localhost:3000/api/auth/google/callback`
   - Pas de `/` à la fin

---

## 📞 **Si ça ne fonctionne toujours pas :**

1. Vérifiez que le projet Google Cloud est bien sélectionné
2. Vérifiez que l'API Google+ est activée
3. Vérifiez que l'écran de consentement OAuth est publié
4. Essayez en mode navigation privée
5. Videz le cache de votre navigateur

---

## ✅ **Checklist finale :**

- [ ] Projet Google Cloud créé
- [ ] API Google+ activée
- [ ] Écran de consentement OAuth configuré
- [ ] Anciens identifiants supprimés (si présents)
- [ ] Nouveaux identifiants OAuth créés
- [ ] Client ID copié dans `.env`
- [ ] Client Secret copié dans `.env`
- [ ] Callback URL configurée dans Google Cloud Console
- [ ] Serveur redémarré
- [ ] Test réussi

---

**Bon courage ! Une fois reconfigurés, vos utilisateurs pourront se connecter avec Google ! 🎉**
