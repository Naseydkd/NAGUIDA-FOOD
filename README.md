# 🍲 NAGUIDA FOOD - La bonne cuisine à votre porte

Site e-commerce complet pour la vente de **cuisine africaine traditionnelle** en ligne avec livraison locale.

---

## 📚 TABLE DES MATIÈRES

1. [À propos](#-à-propos)
2. [Fonctionnalités](#-fonctionnalités)
3. [Menu disponible](#️-menu-disponible)
4. [Architecture Technique](#️-architecture-technique)
5. [Installation rapide](#-installation-rapide-10-min)
6. [Ajouter les images](#-ajouter-les-images-des-plats)
7. [API Endpoints](#-api-endpoints)
8. [Identité Visuelle](#-identité-visuelle)
9. [Déploiement](#-déploiement)
10. [Base de données](#-base-de-données)

---

## 🎯 À propos

**NAGUIDA FOOD** est une plateforme de commande en ligne qui propose des **plats africains authentiques** préparés avec soin et livrés directement chez vous. 

Notre mission : Faire découvrir et partager les saveurs de la cuisine africaine traditionnelle avec une expérience digitale moderne.

---

## ✨ Fonctionnalités

### 🛒 Côté Client
- ✅ **Catalogue de 26 plats africains** répartis en 4 catégories
- ✅ Filtrage par catégorie (Entrées, Plats, Desserts, Boissons)
- ✅ Panier persistant (localStorage)
- ✅ Système d'authentification complet
- ✅ Processus de commande intuitif
- ✅ Choix livraison/retrait
- ✅ Paiements : MyNita ou Cash
- ✅ Système d'avis clients avec slider
- ✅ Design responsive et moderne
- ✅ Thème africain (orange/vert/doré)

### 👨‍💼 Dashboard Administrateur
- ✅ Statistiques en temps réel
- ✅ Gestion des commandes (statuts, détails clients)
- ✅ Gestion des produits (CRUD complet)
- ✅ Gestion des catégories
- ✅ Gestion du stock
- ✅ Gestion des avis clients
- ✅ Paramètres (horaires, notifications)
- ✅ Upload d'images via Cloudinary
- ✅ Graphiques Chart.js
- ✅ Interface moderne et fluide

---

## 🍽️ Menu disponible

### 🥗 Entrées
- Alloco (Bananes plantains frites)
- Beignets Haricots (Akara)
- Accras de Morue
- Nems Africains
- Salade Avocat

### 🍲 Plats Principaux
- Poulet Braisé
- Poisson Braisé
- Riz Gras
- Attiéké Poisson
- Sauce Graine
- Sauce Arachide
- Mafé
- Garba
- Tiep Bou Dien
- Foutou Sauce Claire

### 🍰 Desserts
- Beignets Banane
- Degué
- Thiakry
- Salade de Fruits
- Crème Caramel

### 🥤 Boissons
- Bissap Rouge
- Gnamakoudji (Gingembre)
- Bouye (Baobab)
- Tamarin
- Bissap Blanc
- Tchapalo

---

## 🏗️ Architecture Technique

### Stack
- **Backend**: Node.js + Express.js
- **Base de données**: PostgreSQL
- **Frontend**: HTML5/CSS3/JavaScript (Vanilla)
- **Authentification**: bcryptjs
- **Email**: Nodemailer
- **Images**: Cloudinary
- **Graphiques**: Chart.js

### Structure du Projet
```
Naguida-Food/
├── backend/
│   ├── server.js           # Point d'entrée
│   ├── db.js               # Configuration PostgreSQL
│   ├── schema.sql          # Schéma de base de données
│   ├── seed_african.js     # Données des plats africains
│   ├── routes/             # Routes API REST
│   │   ├── products.js     # CRUD produits
│   │   ├── users.js        # Authentification
│   │   ├── orders.js       # Commandes
│   │   ├── reviews.js      # Avis clients
│   │   ├── categories.js   # Catégories
│   │   └── settings.js     # Paramètres
│   └── package.json
│
└── frontend/
    ├── index.html          # Page publique
    ├── admin.html          # Dashboard admin
    ├── admin-auth.html     # Connexion admin
    ├── css/                # Styles (thème africain)
    ├── js/                 # JavaScript côté client
    └── images/             # Assets (plats africains)
```

---

## ⚡ Installation rapide (10 min)

### Prérequis
- Node.js (v14+)
- PostgreSQL (v12+)

### 1. Installation (2 min)
```bash
cd backend
npm install
```

### 2. Configuration (1 min)
Créer `backend/.env` :
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/naguida_food
PORT=3000
NODE_ENV=development
EMAIL_USER=contact@naguidafood.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM="NAGUIDA FOOD <no-reply@naguidafood.com>"
```

### 3. Base de données (2 min)
```bash
# Créer la base
createdb naguida_food

# Appliquer le schéma
psql naguida_food < backend/schema.sql

# Insérer les plats africains
node backend/seed_african.js
```

### 4. Lancer (1 min)
```bash
cd backend
npm start
```

### 5. Accéder
- **Site**: http://localhost:3000
- **Admin**: http://localhost:3000/admin-auth.html

---

## 📸 Ajouter les images des plats

### Images nécessaires (26)

Télécharger sur **Unsplash** (https://unsplash.com) ou **Pexels** (https://pexels.com) en recherchant "african food", "west african cuisine", etc.

**Renommer et placer dans `/frontend/images/` :**

#### 🥗 Entrées (5)
```
alloco.jpg, akara.jpg, accras.jpg, nems.jpg, salade-avocat.jpg
```

#### 🍲 Plats (10)
```
poulet-braise.jpg, poisson-braise.jpg, riz-gras.jpg, attieke.jpg
sauce-graine.jpg, sauce-arachide.jpg, mafe.jpg, garba.jpg
tiep.jpg, foutou.jpg
```

#### 🍰 Desserts (5)
```
beignet-banane.jpg, degue.jpg, thiakry.jpg
salade-fruits.jpg, creme-caramel.jpg
```

#### 🥤 Boissons (6)
```
bissap.jpg, gnamakoudji.jpg, bouye.jpg
tamarin.jpg, bissap-blanc.jpg, tchapalo.jpg
```

### Spécifications
- **Format**: JPG
- **Dimensions**: 800x600px minimum
- **Poids**: < 200KB par image (utiliser https://tinypng.com pour optimiser)

### Conseils photo
- ✅ Lumière naturelle ou éclairage chaleureux
- ✅ Plat bien centré et en gros plan
- ✅ Couleurs vives et appétissantes
- ✅ Utiliser vos propres photos (RECOMMANDÉ pour l'authenticité)

---

## 🌐 API Endpoints

### Produits
```
GET    /api/products/              # Liste tous les produits
GET    /api/products/?category=plats  # Filtrer par catégorie
GET    /api/products/:id           # Détails d'un produit
POST   /api/products/              # Créer un produit (admin)
PUT    /api/products/:id           # Modifier un produit (admin)
DELETE /api/products/:id           # Supprimer un produit (admin)
```

### Utilisateurs
```
POST   /api/users/register         # Inscription
POST   /api/users/login            # Connexion
GET    /api/users/:id              # Profil utilisateur
PUT    /api/users/:id              # Modifier profil
POST   /api/users/forgot-password  # Demander reset password
POST   /api/users/reset-password   # Réinitialiser password
```

### Commandes
```
POST   /api/orders/                # Créer une commande
GET    /api/orders/                # Toutes les commandes (admin)
GET    /api/orders/:id             # Détails commande
GET    /api/orders/user/:user_id   # Commandes d'un utilisateur
PUT    /api/orders/:id             # Modifier statut
DELETE /api/orders/:id             # Supprimer commande
```

### Avis
```
GET    /api/reviews/               # Tous les avis
GET    /api/reviews/product/:id    # Avis d'un produit
POST   /api/reviews/               # Ajouter un avis
DELETE /api/reviews/:id            # Supprimer un avis (admin)
```

### Catégories
```
GET    /api/categories/            # Liste des catégories
POST   /api/categories/            # Créer/modifier catégories
PUT    /api/categories/:id         # Modifier une catégorie
```

### Paramètres
```
GET    /api/settings/              # Récupérer paramètres
PUT    /api/settings/              # Modifier paramètres
```

---

## 🎨 Identité Visuelle

### Palette de couleurs
```css
Orange principal : #ff6f00
Vert africain    : #2e7d32
Doré             : #d4af37
Marron terracotta: #8d6e63
Bleu pétrole     : #00695c
```

### Gradients
```css
Primaire : linear-gradient(135deg, #ff6f00, #2e7d32, #d4af37)
Secondaire : linear-gradient(135deg, #fff3e0, #e8f5e9)
Background : linear-gradient(135deg, #ff6f00, #2e7d32, #8d6e63, #d4af37, #00695c)
```

### Emojis
- Logo principal : 🍲
- Entrées : 🥗
- Plats : 🍲
- Desserts : 🍰
- Boissons : 🥤

---

## 🚀 Déploiement

### Option 1: Vercel ⭐ RECOMMANDÉ

#### 1. Créer compte
- Aller sur https://vercel.com
- S'inscrire avec GitHub

#### 2. Importer le projet
1. Dashboard > Add New > Project
2. Connecter votre repo GitHub
3. Garder la racine du projet comme Root Directory
4. Vercel utilise `vercel.json` pour servir le frontend et l'API

#### 3. Base de données PostgreSQL
Utiliser une base PostgreSQL externe compatible Vercel, par exemple Supabase, Neon ou Vercel Postgres, puis copier l'URL de connexion.

#### 4. Variables d'environnement
Dans Vercel > Project Settings > Environment Variables :
```
DATABASE_URL = [URL PostgreSQL]
NODE_ENV = production
PUBLIC_URL = https://votre-site.vercel.app
SESSION_SECRET = une-cle-longue-et-secrete
EMAIL_USER = votre-email@gmail.com
EMAIL_PASS = votre-mot-de-passe-app
EMAIL_FROM = "NAGUIDA FOOD <no-reply@naguidafood.com>"
```

Pour Google OAuth, ajouter aussi :
```
GOOGLE_CLIENT_ID = votre-client-id
GOOGLE_CLIENT_SECRET = votre-client-secret
GOOGLE_CALLBACK_URL = https://votre-site.vercel.app/api/auth/google/callback
```

#### 5. Initialiser la base
Depuis votre machine, avec `DATABASE_URL` configurée vers la base de production :
```bash
psql "$DATABASE_URL" < backend/schema.sql
node backend/seed_african.js
```

#### 6. ✅ C'est en ligne !
URL: `https://votre-site.vercel.app`

### Option 2: Heroku

1. Installer Heroku CLI
2. Créer une app: `heroku create naguida-food`
3. Ajouter PostgreSQL: `heroku addons:create heroku-postgresql:mini`
4. Configurer les variables d'environnement
5. Deploy: `git push heroku main`

### Option 3: Vercel (Frontend) + Railway (Backend)

- **Frontend sur Vercel** (gratuit, CDN mondial)
- **Backend sur Railway** (PostgreSQL inclus)

### Configuration DNS & Domaine

1. Acheter un domaine (Namecheap, GoDaddy)
2. Configurer les DNS:
   ```
   Type: A ou CNAME
   Host: @
   Value: [IP ou URL de votre hébergeur]
   ```
3. Configurer SSL (automatique sur Render/Vercel)

---

## 🔐 Créer un compte Admin

### Méthode 1: Via la base de données
```sql
UPDATE users SET is_admin = true WHERE email = 'votre@email.com';
```

### Méthode 2: Via script
```bash
node backend/create_admin.js
# Suivre les instructions
```

---

## 🧪 Tests & Troubleshooting

### Checklist de tests
- [ ] Inscription utilisateur
- [ ] Connexion utilisateur
- [ ] Ajout au panier
- [ ] Création de commande
- [ ] Connexion admin
- [ ] Gestion produits (CRUD)
- [ ] Gestion commandes
- [ ] Système d'avis
- [ ] Reset password par email
- [ ] Responsive mobile

### Problèmes courants

#### Erreur: "Cannot find module"
```bash
cd backend
npm install
```

#### Erreur: "Database does not exist"
```bash
createdb naguida_food
```

#### Erreur: "Port 3000 already in use"
```bash
# Changer le port dans .env
PORT=3001
```

#### Images ne s'affichent pas
- Vérifier que les fichiers sont dans `/frontend/images/`
- Vérifier les noms de fichiers (minuscules, .jpg)
- Clear le cache du navigateur

---

## 📊 Base de données

### Tables principales:
- `users` - Utilisateurs et admins (email, password_hash, is_admin, reset_token, etc.)
- `products` - Catalogue des plats (name, category, price, image_url, stock, available)
- `categories` - Catégories (Entrées, Plats, Desserts, Boissons)
- `orders` - Commandes clients (user_id, status, total_price, delivery_type, payment_method)
- `order_items` - Articles des commandes (order_id, product_id, quantity, unit_price)
- `reviews` - Avis clients (product_id, user_id, rating 1-5, comment)
- `settings` - Paramètres du site (horaires, notifications, sonnerie)

### Schéma complet

**Users:**
```sql
id, email, username, password_hash, first_name, last_name, 
phone, address, city, postal_code, is_admin, 
reset_token, reset_token_expires, created_at
```

**Products:**
```sql
id, name, category, description, price, image_url, 
available, stock, display_order, is_featured, created_at
```

**Orders:**
```sql
id, user_id, order_date, status, total_price, 
delivery_type, payment_method, notes
```

**Reviews:**
```sql
id, product_id, user_id, rating, comment, created_at
```

### Initialiser avec les plats africains:
```bash
node seed_african.js
```

---

## 🛠️ Technologies utilisées

### Backend
- **Express.js** - Framework web Node.js
- **PostgreSQL** - Base de données relationnelle
- **pg** - Driver PostgreSQL
- **bcryptjs** - Hachage des mots de passe
- **nodemailer** - Envoi d'emails
- **dotenv** - Gestion des variables d'environnement
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styles (design africain moderne)
- **JavaScript ES6+** - Logique côté client
- **Chart.js** - Graphiques dashboard
- **Cloudinary** - Stockage d'images

---

## 📝 Documentation complémentaire

Toute la documentation nécessaire est maintenant dans ce README.

Pour toute question ou assistance :
- **Email**: support@naguidafood.com
- **WhatsApp**: +XXX XX XX XX XX

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🐛 Signaler un bug

Utiliser l'onglet "Issues" sur GitHub pour signaler des bugs ou proposer des améliorations.

---

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

**NAGUIDA FOOD**  
La bonne cuisine africaine à votre porte

- Website: [naguidafood.com](https://naguidafood.com)
- Email: contact@naguidafood.com
- Instagram: @naguidafood
- Facebook: /naguidafood

---

## 🙏 Remerciements

- Tous les contributeurs
- La communauté open source
- Nos clients fidèles

---

## 🗺️ Roadmap

### Version 1.0 (Actuelle)
- [x] Site e-commerce complet
- [x] Dashboard admin
- [x] Système de commandes
- [x] Paiement cash/MyNita
- [x] Avis clients

### Version 1.1 (Prochainement)
- [ ] Intégration paiement Stripe/PayPal
- [ ] Application mobile (React Native)
- [ ] Programme de fidélité
- [ ] Système de promotions/coupons
- [ ] Chat en direct client/admin

### Version 2.0 (Future)
- [ ] Multi-vendeurs (marketplace)
- [ ] Suivi GPS des livreurs
- [ ] Notifications push
- [ ] Recommandations IA
- [ ] Multi-langues (FR/EN/...)

---

## 📞 Support

Pour toute question ou assistance :

- **Email**: support@naguidafood.com
- **WhatsApp**: +XXX XX XX XX XX

---

## ⭐ Vous aimez ce projet ?

N'hésitez pas à mettre une étoile ⭐ sur GitHub !

---

**Créé avec ❤️ pour partager la richesse de la cuisine africaine**

🍲 **NAGUIDA FOOD - La bonne cuisine à votre porte** 🍲

---

*Dernière mise à jour: Janvier 2025*
