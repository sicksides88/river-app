-- =============================================
-- FIX: Agregar columnas faltantes a tabla rides
-- =============================================

-- Agregar columna accepted_at (timestamp cuando el conductor acepta)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE public.rides
    ADD COLUMN accepted_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Agregar columna cancellation_reason (motivo de cancelación)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE public.rides
    ADD COLUMN cancellation_reason VARCHAR(255) NULL;
  END IF;
END $$;

-- Índice para buscar viajes aceptados por fecha
CREATE INDEX IF NOT EXISTS idx_rides_accepted_at
ON public.rides(accepted_at)
WHERE accepted_at IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN public.rides.accepted_at IS 'Fecha y hora cuando el conductor aceptó el viaje';
COMMENT ON COLUMN public.rides.cancellation_reason IS 'Motivo de cancelación del viaje';
