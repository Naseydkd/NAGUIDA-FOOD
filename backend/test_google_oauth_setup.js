require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Vérification de la configuration Google OAuth\n');
console.log('='.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// 1. Vérifier les variables d'environnement
console.log('\n📋 Variables d\'environnement :');
console.log('-'.repeat(60));

const requiredEnvVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_CALLBACK_URL': process.env.GOOGLE_CALLBACK_URL,
    'SESSION_SECRET': process.env.SESSION_SECRET
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.includes('your-') || value.includes('VOTRE_')) {
        console.log(`❌ ${key}: NON CONFIGURÉ (${value || 'manquant'})`);
        hasErrors = true;
    } else {
        // Masquer les secrets
        const displayValue = key.includes('SECRET') || key.includes('CLIENT_ID')
            ? value.substring(0, 10) + '...' 
            : value;
        console.log(`✅ ${key}: ${displayValue}`);
    }
});

// 2. Vérifier les dépendances npm
console.log('\n📦 Dépendances npm :');
console.log('-'.repeat(60));

try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const requiredPackages = ['passport', 'passport-google-oauth20', 'express-session'];
    
    requiredPackages.forEach(pkg => {
        if (packageJson.dependencies[pkg]) {
            console.log(`✅ ${pkg}: ${packageJson.dependencies[pkg]}`);
        } else {
            console.log(`❌ ${pkg}: NON INSTALLÉ`);
            hasErrors = true;
        }
    });
} catch (error) {
    console.log(`❌ Erreur lecture package.json: ${error.message}`);
    hasErrors = true;
}

// 3. Vérifier les fichiers requis
console.log('\n📁 Fichiers requis :');
console.log('-'.repeat(60));

const requiredFiles = [
    './config/passport.js',
    './routes/auth.js',
    './migrate_add_google_oauth.sql'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file}: MANQUANT`);
        hasErrors = true;
    }
});

// 4. Vérifier les modifications dans server.js
console.log('\n🔧 Modifications server.js :');
console.log('-'.repeat(60));

try {
    const serverContent = fs.readFileSync('./server.js', 'utf8');
    
    const checks = {
        'express-session importé': serverContent.includes("require('express-session')"),
        'passport importé': serverContent.includes('./config/passport'),
        'session middleware': serverContent.includes('app.use(session'),
        'passport.initialize()': serverContent.includes('passport.initialize()'),
        'passport.session()': serverContent.includes('passport.session()'),
        'route /api/auth': serverContent.includes("require('./routes/auth')")
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
        if (passed) {
            console.log(`✅ ${check}`);
        } else {
            console.log(`❌ ${check}`);
            hasErrors = true;
        }
    });
} catch (error) {
    console.log(`❌ Erreur lecture server.js: ${error.message}`);
    hasErrors = true;
}

// 5. Conseils de configuration
console.log('\n💡 Prochaines étapes :');
console.log('-'.repeat(60));

if (hasErrors) {
    console.log('\n⚠️  DES PROBLÈMES ONT ÉTÉ DÉTECTÉS\n');
    
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('your-')) {
        console.log('📝 Pour obtenir vos credentials Google :');
        console.log('   1. Consultez le fichier GOOGLE_OAUTH_SETUP.md');
        console.log('   2. Allez sur https://console.cloud.google.com/');
        console.log('   3. Créez un projet et configurez OAuth 2.0');
        console.log('   4. Copiez Client ID et Client Secret dans .env\n');
    }
} else if (hasWarnings) {
    console.log('\n⚠️  AVERTISSEMENTS DÉTECTÉS (non bloquants)\n');
} else {
    console.log('\n✅ TOUT EST PRÊT !\n');
    console.log('🎉 Votre configuration Google OAuth est complète.');
    console.log('\n📝 N\'oubliez pas :');
    console.log('   1. Exécuter la migration SQL dans Supabase');
    console.log('   2. Redémarrer le serveur : npm start');
    console.log('   3. Tester : http://localhost:3000/admin-auth.html\n');
}

// 6. Vérifier la migration SQL
console.log('\n🗄️  Migration base de données :');
console.log('-'.repeat(60));

if (fs.existsSync('./migrate_add_google_oauth.sql')) {
    console.log('✅ Fichier migration SQL trouvé');
    console.log('⚠️  À exécuter dans Supabase SQL Editor :');
    console.log('   - Allez sur https://app.supabase.com/');
    console.log('   - Ouvrez SQL Editor');
    console.log('   - Copiez le contenu de migrate_add_google_oauth.sql');
    console.log('   - Cliquez sur "Run"');
} else {
    console.log('❌ Fichier migration SQL introuvable');
    hasErrors = true;
}

console.log('\n' + '='.repeat(60));

// Code de sortie
process.exit(hasErrors ? 1 : 0);
