-- ============================================================
-- River Service — habilitar patrón/conductor para admin@demo.com
-- Ejecutar en: Supabase → SQL Editor → Run
-- (v2 — crea columnas ANTES de constraints y UPDATE)
-- ============================================================

BEGIN;

-- ── 1) Columnas en profiles (primero siempre) ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_status VARCHAR(50);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_type VARCHAR(50);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_services TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_services TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_verified_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_points INTEGER DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'bronce';

-- ── 2) Constraint driver_type (después de crear la columna) ───
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_driver_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_driver_type_check
  CHECK (
    driver_type IS NULL
    OR driver_type IN (
      'vuelta_segura', 'fletes', 'cadete', 'chofer', 'envios', 'auxilio'
    )
  );

-- ── 3) Perfil patrón activo ───────────────────────────────────
UPDATE public.profiles
SET
  is_driver = TRUE,
  driver_status = 'active',
  driver_type = 'auxilio',
  driver_services = ARRAY['auxilio']::text[],
  selected_services = ARRAY['auxilio']::text[],
  onboarding_completed = TRUE,
  is_verified = TRUE,
  driver_verified_at = COALESCE(driver_verified_at, NOW()),
  updated_at = NOW()
WHERE lower(trim(email)) = lower('admin@demo.com');

-- ── 4) driver_schedules (si la tabla existe) ───────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'driver_schedules'
  ) THEN
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
  END IF;
END $$;

-- ── 5) driver_availability (si la tabla existe) ───────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'driver_availability'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'driver_availability'
        AND column_name = 'active_service_type'
    ) THEN
      ALTER TABLE public.driver_availability
        ADD COLUMN active_service_type VARCHAR(50);
    END IF;

    INSERT INTO public.driver_availability (driver_id, is_available, active_service_type)
    SELECT p.id, FALSE, NULL
    FROM public.profiles p
    WHERE lower(trim(p.email)) = lower('admin@demo.com')
    ON CONFLICT (driver_id) DO NOTHING;
  END IF;
END $$;

-- ── 6) Embarcación demo (si driver_vehicles existe) ───────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'driver_vehicles'
  ) THEN
    INSERT INTO public.driver_vehicles (
      driver_id, vehicle_type, brand, model, year, color, plate_number, capacity, is_active, is_verified
    )
    SELECT
      p.id, 'boat', 'River', 'Patrulla', 2020, 'Blanco', 'LRI-2210', 6, TRUE, TRUE
    FROM public.profiles p
    WHERE lower(trim(p.email)) = lower('admin@demo.com')
      AND NOT EXISTS (
        SELECT 1 FROM public.driver_vehicles v
        WHERE v.driver_id = p.id AND v.is_active = TRUE
      );
  END IF;
END $$;

COMMIT;

-- ── 7) Verificación ───────────────────────────────────────────
SELECT
  id,
  email,
  role,
  is_driver,
  driver_status,
  driver_type,
  selected_services,
  onboarding_completed,
  driver_verified_at
FROM public.profiles
WHERE lower(trim(email)) = lower('admin@demo.com');
