-- =============================================
-- VNR - Migración: Campos de notificación en rides
-- =============================================

-- Agregar campo para tracking de notificación "conductor cerca"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'nearby_notification_sent'
  ) THEN
    ALTER TABLE public.rides
    ADD COLUMN nearby_notification_sent BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Índice para buscar viajes pendientes de notificación
CREATE INDEX IF NOT EXISTS idx_rides_nearby_notification
ON public.rides(status, nearby_notification_sent)
WHERE status IN ('accepted', 'en_route');

COMMENT ON COLUMN public.rides.nearby_notification_sent IS 'Indica si ya se envió la notificación de conductor cercano';
