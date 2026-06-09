-- Migration pour ajouter l'authentification Google OAuth
-- À exécuter dans votre base de données Supabase

-- Ajouter la colonne google_id pour stocker l'ID Google unique
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Permettre le champ phone d'être nullable pour les utilisateurs Google
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
