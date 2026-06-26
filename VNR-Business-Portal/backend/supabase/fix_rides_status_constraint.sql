-- =============================================
-- FIX: Actualizar CHECK constraint de status en rides
-- =============================================

-- Eliminar constraint existente
ALTER TABLE public.rides
DROP CONSTRAINT IF EXISTS rides_status_check;

-- Crear nuevo constraint con todos los estados válidos
ALTER TABLE public.rides
ADD CONSTRAINT rides_status_check
CHECK (status IN (
  'pending',      -- Viaje creado, buscando conductor
  'accepted',     -- Conductor aceptó el viaje
  'en_route',     -- Conductor en camino al pickup
  'arrived',      -- Conductor llegó al punto de pickup
  'in_progress',  -- Viaje en curso
  'completed',    -- Viaje completado
  'cancelled',    -- Viaje cancelado
  'no_drivers'    -- No se encontraron conductores
));
