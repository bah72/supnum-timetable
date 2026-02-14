-- Mettre à jour la table users pour ajouter le rôle scheduler
-- Exécuter ce script dans la console Supabase SQL Editor

-- 1. Mettre à jour la contrainte CHECK pour inclure scheduler
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- 2. Recréer la contrainte CHECK avec tous les rôles y compris scheduler
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'prof', 'etudiant', 'scheduler'));

-- 3. Vérifier la mise à jour
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';

-- 4. Afficher les contraintes actuelles
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'users'::table;
