-- Migration: Coordonnées de contact sur les commandes
-- Ajoute phone, address, city à la table orders (si absentes)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
