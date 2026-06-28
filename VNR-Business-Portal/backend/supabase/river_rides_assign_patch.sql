-- River Service: columnas necesarias para asignación manual de auxilios desde CRM
-- Ejecutar en Supabase si PUT /admin/auxilios/:id/assign devuelve 500

-- accepted_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE public.rides ADD COLUMN accepted_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Estados válidos (incluye 'accepted')
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check
  CHECK (status IN (
    'pending', 'accepted', 'en_route', 'arrived', 'in_progress',
    'completed', 'cancelled', 'no_drivers'
  ));

-- La embarcación de patrón se guarda en rides.notes (patrolVehicleId).
-- No usar rides.vehicle_id salvo que exista FK a driver_vehicles en tu esquema.
