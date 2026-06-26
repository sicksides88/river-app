-- Campos extra del formulario de embarcación (Pencil onboarding)
ALTER TABLE public.vessels
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS draft_m NUMERIC,
  ADD COLUMN IF NOT EXISTS depth_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geographic_area TEXT;
