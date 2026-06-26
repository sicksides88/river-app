-- ============================================================
-- Crear tabla driver_schedules (disponibilidad patrón / chofer)
-- Ejecutar en Supabase → SQL Editor si guardar disponibilidad falla
-- Error típico: Could not find the table 'public.driver_schedules'
-- ============================================================

CREATE TABLE IF NOT EXISTS public.driver_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekly_schedule JSONB DEFAULT '[
    {"day_of_week": 0, "is_available": false, "time_ranges": []},
    {"day_of_week": 1, "is_available": true, "time_ranges": [{"id": "default-1", "start_time": "09:00", "end_time": "18:00"}]},
    {"day_of_week": 2, "is_available": true, "time_ranges": [{"id": "default-2", "start_time": "09:00", "end_time": "18:00"}]},
    {"day_of_week": 3, "is_available": true, "time_ranges": [{"id": "default-3", "start_time": "09:00", "end_time": "18:00"}]},
    {"day_of_week": 4, "is_available": true, "time_ranges": [{"id": "default-4", "start_time": "09:00", "end_time": "18:00"}]},
    {"day_of_week": 5, "is_available": true, "time_ranges": [{"id": "default-5", "start_time": "09:00", "end_time": "18:00"}]},
    {"day_of_week": 6, "is_available": false, "time_ranges": []}
  ]'::jsonb,
  custom_dates JSONB DEFAULT '[]'::jsonb,
  booking_config JSONB DEFAULT '{
    "max_advance_days": 60,
    "min_notice_hours": 4,
    "buffer_days": 10,
    "buffer_type": "calendar"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON public.driver_schedules(driver_id);

CREATE OR REPLACE FUNCTION public.update_driver_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_driver_schedules_updated_at ON public.driver_schedules;
CREATE TRIGGER trigger_driver_schedules_updated_at
  BEFORE UPDATE ON public.driver_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_schedules_updated_at();

ALTER TABLE public.driver_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conductores pueden ver su propio horario" ON public.driver_schedules;
CREATE POLICY "Conductores pueden ver su propio horario"
  ON public.driver_schedules FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Conductores pueden insertar su propio horario" ON public.driver_schedules;
CREATE POLICY "Conductores pueden insertar su propio horario"
  ON public.driver_schedules FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Conductores pueden actualizar su propio horario" ON public.driver_schedules;
CREATE POLICY "Conductores pueden actualizar su propio horario"
  ON public.driver_schedules FOR UPDATE
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins pueden ver todos los horarios" ON public.driver_schedules;
CREATE POLICY "Admins pueden ver todos los horarios"
  ON public.driver_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins pueden actualizar todos los horarios" ON public.driver_schedules;
CREATE POLICY "Admins pueden actualizar todos los horarios"
  ON public.driver_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Verificación
SELECT 'driver_schedules OK' AS status, count(*) AS filas FROM public.driver_schedules;
