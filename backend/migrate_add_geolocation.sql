-- Migration: Ajout des champs de géolocalisation
-- Date: 9 juin 2026
-- Description: Ajouter latitude et longitude pour faciliter la livraison

-- Table users (optionnel - pour sauvegarder l'adresse par défaut)
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Table orders (IMPORTANT - pour la livraison de chaque commande)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8);

-- Note: Les utilisateurs peuvent partager leur position lors de CHAQUE commande
-- pour une livraison précise, même s'ils commandent depuis différents endroits
