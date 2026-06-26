-- River Service: suscripción demo (plan Bronce / Plata / Premium)
-- Ejecutar en Supabase SQL Editor si aún no existen las columnas.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'bronce',
  ADD COLUMN IF NOT EXISTS subscription_billing_cycle VARCHAR(20) DEFAULT 'annual',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TEXT;

COMMENT ON COLUMN public.profiles.subscription_plan IS 'bronce | plata | premium';
COMMENT ON COLUMN public.profiles.subscription_billing_cycle IS 'annual | monthly';
