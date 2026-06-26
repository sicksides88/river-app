-- ============================================================
-- River Service — bootstrap conductor/patrón (EJECUTAR UNA VEZ)
-- Supabase → SQL Editor → Run
--
-- Corrige errores del log:
--   • driver_schedules no existe
--   • driver_vehicles no existe
--   • driver_availability no existe
--   • profiles.driver_status / driver_type / rating_average faltan
-- ============================================================

BEGIN;

-- ── 1) Columnas en profiles ─────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_status VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_type VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_services TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_services TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'bronce';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_driver_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_driver_type_check
  CHECK (
    driver_type IS NULL
    OR driver_type IN ('vuelta_segura','fletes','cadete','chofer','envios','auxilio')
  );

-- ── 2) driver_vehicles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) DEFAULT 'boat',
  brand VARCHAR(100) NOT NULL DEFAULT 'River',
  model VARCHAR(100) NOT NULL DEFAULT 'Patrulla',
  year INTEGER NOT NULL DEFAULT 2020,
  color VARCHAR(50),
  plate_number VARCHAR(20) NOT NULL,
  capacity INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.driver_vehicles
  ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver_id ON public.driver_vehicles(driver_id);

-- ── 3) driver_availability ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.driver_availability (
  driver_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT FALSE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  current_vehicle_id UUID REFERENCES public.driver_vehicles(id),
  active_service_type VARCHAR(50),
  last_location_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.driver_availability
  ADD COLUMN IF NOT EXISTS active_service_type VARCHAR(50);

-- ── 4) driver_schedules (disponibilidad semanal) ─────────────
CREATE TABLE IF NOT EXISTS public.driver_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekly_schedule JSONB DEFAULT '[
    {"day_of_week":0,"is_available":false,"time_ranges":[]},
    {"day_of_week":1,"is_available":true,"time_ranges":[{"id":"mon","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":2,"is_available":true,"time_ranges":[{"id":"tue","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":3,"is_available":true,"time_ranges":[{"id":"wed","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":4,"is_available":true,"time_ranges":[{"id":"thu","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":5,"is_available":true,"time_ranges":[{"id":"fri","start_time":"08:00","end_time":"20:00"}]},
    {"day_of_week":6,"is_available":true,"time_ranges":[{"id":"sat","start_time":"08:00","end_time":"14:00"}]}
  ]'::jsonb,
  custom_dates JSONB DEFAULT '[]'::jsonb,
  booking_config JSONB DEFAULT '{"max_advance_days":60,"min_notice_hours":4,"buffer_days":10,"buffer_type":"calendar"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON public.driver_schedules(driver_id);

-- ── 5) driver_documents (mínimo, por si el onboarding lo pide)
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL DEFAULT '',
  file_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6) Activar admin@demo.com como patrón ────────────────────
UPDATE public.profiles
SET
  is_driver = TRUE,
  driver_status = 'active',
  driver_type = 'auxilio',
  driver_services = ARRAY['auxilio']::text[],
  selected_services = ARRAY['auxilio']::text[],
  onboarding_completed = TRUE,
  driver_verified_at = COALESCE(driver_verified_at, NOW()),
  rating_average = COALESCE(rating_average, 5.00),
  rating_count = COALESCE(rating_count, 0),
  updated_at = NOW()
WHERE lower(trim(email)) = lower('admin@demo.com');

-- Schedule demo
INSERT INTO public.driver_schedules (driver_id, weekly_schedule, custom_dates, booking_config)
SELECT
  p.id,
  '[
    {"day_of_week":0,"is_available":false,"time_ranges":[]},
    {"day_of_week":1,"is_available":true,"time_ranges":[{"id":"mon","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":2,"is_available":true,"time_ranges":[{"id":"tue","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":3,"is_available":true,"time_ranges":[{"id":"wed","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":4,"is_available":true,"time_ranges":[{"id":"thu","start_time":"08:00","end_time":"16:00"}]},
    {"day_of_week":5,"is_available":true,"time_ranges":[{"id":"fri","start_time":"08:00","end_time":"20:00"}]},
    {"day_of_week":6,"is_available":true,"time_ranges":[{"id":"sat","start_time":"08:00","end_time":"14:00"}]}
  ]'::jsonb,
  '[]'::jsonb,
  '{"max_advance_days":60,"min_notice_hours":4,"buffer_days":10,"buffer_type":"calendar"}'::jsonb
FROM public.profiles p
WHERE lower(trim(p.email)) = lower('admin@demo.com')
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO public.driver_availability (driver_id, is_available)
SELECT p.id, FALSE FROM public.profiles p
WHERE lower(trim(p.email)) = lower('admin@demo.com')
ON CONFLICT (driver_id) DO NOTHING;

INSERT INTO public.driver_vehicles (driver_id, vehicle_type, brand, model, year, color, plate_number, is_active, is_verified)
SELECT p.id, 'boat', 'River', 'Patrulla', 2020, 'Blanco', 'LRI-2210', TRUE, TRUE
FROM public.profiles p
WHERE lower(trim(p.email)) = lower('admin@demo.com')
  AND NOT EXISTS (SELECT 1 FROM public.driver_vehicles v WHERE v.driver_id = p.id AND v.is_active = TRUE);

COMMIT;

-- ── Verificación ─────────────────────────────────────────────
SELECT 'profiles' AS tabla, email, is_driver, driver_status, driver_type, rating_average
FROM public.profiles WHERE lower(trim(email)) = lower('admin@demo.com');

SELECT 'driver_schedules' AS tabla, count(*) AS filas FROM public.driver_schedules;
SELECT 'driver_vehicles' AS tabla, count(*) AS filas FROM public.driver_vehicles;
SELECT 'driver_availability' AS tabla, count(*) AS filas FROM public.driver_availability;
