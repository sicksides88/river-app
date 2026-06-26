-- =============================================
-- FIX: Actualizar constraint de driver_type en profiles
-- El constraint actual no acepta los valores correctos
-- =============================================

-- Primero eliminar el constraint existente
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_driver_type_check;

-- Crear el nuevo constraint con los valores correctos
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_driver_type_check
CHECK (driver_type IS NULL OR driver_type IN ('vuelta_segura', 'fletes', 'cadete', 'chofer', 'envios'));

-- Verificar que la columna driver_type existe, si no, agregarla
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_type') THEN
    ALTER TABLE public.profiles ADD COLUMN driver_type VARCHAR(50) DEFAULT NULL;
  END IF;
END $$;
