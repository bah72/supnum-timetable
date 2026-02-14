-- Script pour corriger la contrainte CHECK et ajouter le rôle scheduler
-- Exécuter ce script dans la console SQL de Supabase

-- Étape 1: Mettre à jour les utilisateurs existants qui n'ont pas de rôle valide
-- (au cas où certains utilisateurs ont des rôles non standards)
UPDATE users SET role = 'etudiant' WHERE role NOT IN ('admin', 'prof', 'etudiant');

-- Étape 2: Supprimer l'ancienne contrainte
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Étape 3: Ajouter la nouvelle contrainte avec tous les rôles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'prof', 'etudiant', 'scheduler'));

-- Étape 4: Afficher les utilisateurs actuels pour vérification
SELECT id, username, role, is_active FROM users ORDER BY created_at DESC;
