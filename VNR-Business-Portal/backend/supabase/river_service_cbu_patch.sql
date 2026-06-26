-- Parche: CBU sin límite de 22 caracteres (coincide con validación de la app)
ALTER TABLE public.profiles
  ALTER COLUMN cbu TYPE TEXT;

-- Por si account_type quedó con límite corto en algún entorno
ALTER TABLE public.profiles
  ALTER COLUMN account_type TYPE TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN billing_preference TYPE TEXT;
