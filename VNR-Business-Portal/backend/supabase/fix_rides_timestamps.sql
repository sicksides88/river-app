-- =============================================
-- FIX: Agregar columnas de timestamps a tabla rides
-- =============================================

-- Columna arrived_at (cuando el conductor llega al punto de pickup)
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ NULL;

-- Columna started_at (cuando inicia el viaje)
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

-- Columna completed_at (cuando se completa el viaje)
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Comentarios
COMMENT ON COLUMN public.rides.arrived_at IS 'Fecha y hora cuando el conductor llegó al punto de pickup';
COMMENT ON COLUMN public.rides.started_at IS 'Fecha y hora cuando inició el viaje';
COMMENT ON COLUMN public.rides.completed_at IS 'Fecha y hora cuando se completó el viaje';
