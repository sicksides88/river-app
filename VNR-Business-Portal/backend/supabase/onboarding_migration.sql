-- Migracion para agregar campos de onboarding a la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- Agregar campo onboarding_completed
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Agregar campo selected_services (array de strings)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS selected_services TEXT[] DEFAULT '{}';

-- Comentarios descriptivos
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indica si el usuario completo el proceso de onboarding inicial';
COMMENT ON COLUMN profiles.selected_services IS 'Array de servicios seleccionados por el usuario (vuelta_segura, fletes, cadete, chofer)';

-- Indice para consultas de usuarios que no completaron onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed) WHERE onboarding_completed = FALSE;
