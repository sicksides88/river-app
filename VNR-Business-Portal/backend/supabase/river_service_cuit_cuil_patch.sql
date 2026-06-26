-- Parche rápido: columna cuit_cuil en profiles (error PGRST204 al guardar socio independiente)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuit_cuil VARCHAR(20);
