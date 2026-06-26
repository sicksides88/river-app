-- Columnas extra que usa el backend de registro (auth.controller)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuit_cuil VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tiene_comercio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS domicilio_comercio TEXT;
