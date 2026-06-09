#!/bin/bash

# 🚀 Script de lancement NAGUIDA FOOD
# Usage: ./start.sh

echo "🍲 NAGUIDA FOOD - Démarrage..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Node.js
echo -e "${BLUE}📦 Vérification de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installez Node.js depuis https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo ""

# Se placer dans le dossier backend
cd "$(dirname "$0")/backend" || exit

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    echo ""
fi

# Vérifier la connexion DB
echo -e "${BLUE}🔗 Vérification de la connexion DB...${NC}"
node -e "const db = require('./db'); db.query('SELECT 1', (err) => { if(err) { console.log('❌ Erreur DB:', err.message); process.exit(1); } else { console.log('✅ Connexion DB OK'); } db.end(); })" || exit 1
echo ""

# Lancer le serveur
echo -e "${GREEN}🚀 Lancement du serveur backend...${NC}"
echo -e "${BLUE}📍 Backend : http://localhost:3000/api/${NC}"
echo -e "${BLUE}🌐 Frontend : http://localhost:3000/${NC}"
echo -e "${BLUE}👨‍💼 Admin : http://localhost:3000/admin-auth.html${NC}"
echo ""
echo -e "${YELLOW}⚠️  Appuyez sur Ctrl+C pour arrêter le serveur${NC}"
echo ""

npm run dev
