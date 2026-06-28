-- River Service: columnas necesarias para asignación manual de auxilios desde CRM
-- Ejecutar en Supabase SQL Editor si PUT /admin/auxilios/:id/assign falla

-- accepted_at (opcional: el backend también guarda assignedAt en notes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rides' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE public.rides ADD COLUMN accepted_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- arrived_at / started_at / completed_at (por si faltan en flujo náutico)
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ NULL;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Estados válidos (incluye 'accepted')
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check
  CHECK (status IN (
    'pending', 'accepted', 'en_route', 'arrived', 'in_progress',
    'completed', 'cancelled', 'no_drivers'
  ));

-- Refrescar caché de esquema de PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';

-- La embarcación de patrón se guarda en rides.notes (patrolVehicleId).
