# GeneHub - Déploiement Web (Vercel)

Ce dossier contient les fichiers statiques pour le site web GeneHub déployé sur Vercel.

## 📋 Objectif

Le site Vercel sert principalement de **landing page OAuth** pour l'authentification Google sur mobile.

## 🔐 Configuration OAuth

### 1. URLs à configurer dans Supabase

**Dashboard → Authentication → URL Configuration**

- **Site URL**: `https://gene-hub-snowy.vercel.app`
- **Redirect URLs** (ajouter les deux) :
  ```
  https://gene-hub-snowy.vercel.app/auth/callback
  genehub://auth/callback
  ```

### 2. URLs à configurer dans Google Cloud Console

**APIs & Services → Credentials → OAuth 2.0 Client ID**

- **Authorized JavaScript origins** :
  ```
  https://gene-hub-snowy.vercel.app
  https://<VOTRE_PROJET>.supabase.co
  ```

- **Authorized redirect URIs** :
  ```
  https://<VOTRE_PROJET>.supabase.co/auth/v1/callback
  https://gene-hub-snowy.vercel.app/auth/callback
  ```

## 🚀 Déploiement sur Vercel

### Méthode 1 : Via GitHub (recommandé)

1. Push le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com)
3. Import Project → Select Repository
4. Déployer (Vercel détectera automatiquement la configuration)

### Méthode 2 : Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## 📁 Structure

```
public/
├── index.html          # Page d'accueil
├── auth-callback.html  # Page de callback OAuth (route: /auth/callback)
└── ...

vercel.json             # Configuration des routes Vercel
```

## 🔄 Flow OAuth

1. **Mobile** : User clique "Se connecter avec Google"
2. **App** : Ouvre WebBrowser avec l'URL Supabase OAuth
3. **Google** : User donne son consentement
4. **Supabase** : Génère un code et redirige vers Vercel
5. **Vercel** : `/auth/callback` reçoit le code
6. **JavaScript** : Détecte le code et fait un deep-link vers `genehub://`
7. **App** : Reçoit le code via le deep-link
8. **App** : Appelle `exchangeCodeForSession()` pour obtenir la session

## 🛠️ Tests locaux

Pour tester localement :

```bash
# Installer un serveur HTTP simple
npm install -g http-server

# Servir les fichiers public/
cd public
http-server -p 3000

# Tester la page callback
open http://localhost:3000/auth-callback.html?code=TEST_CODE
```

## 🔍 Debugging

Si l'authentification ne fonctionne pas :

1. **Vérifier les logs** dans `src/lib/auth.ts` (console.log activés en dev)
2. **Vérifier la console navigateur** sur la page callback
3. **Vérifier que le scheme `genehub://` est bien configuré** dans app.json
4. **Rebuild l'app** après modification de app.json : `eas build`

## ⚠️ Important

- Les fichiers dans `public/` sont servis **statiquement** (pas de React/Expo)
- Le fichier `vercel.json` configure la redirection `/auth/callback` → `/auth-callback.html`
- Le deep-link `genehub://` doit être enregistré dans l'OS (via app.json)
