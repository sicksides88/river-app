-- River Service: parches incrementales (ejecutar si ya tenés el bootstrap base)
-- Copiá y pegá todo en Supabase SQL Editor

-- 1) Embarcaciones: campos del formulario Pencil
ALTER TABLE public.vessels
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS draft_m NUMERIC,
  ADD COLUMN IF NOT EXISTS depth_m NUMERIC,
  ADD COLUMN IF NOT EXISTS geographic_area TEXT;

-- 2) Perfiles: registro + membresía y onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuit_cuil VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tiene_comercio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS domicilio_comercio TEXT,
  ADD COLUMN IF NOT EXISTS link_type VARCHAR(20) DEFAULT 'independiente',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS policy_number TEXT,
  ADD COLUMN IF NOT EXISTS policy_expiry_date TEXT,
  ADD COLUMN IF NOT EXISTS policy_document_url TEXT,
  ADD COLUMN IF NOT EXISTS account_holder TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS cbu TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_preference TEXT,
  ADD COLUMN IF NOT EXISTS membership_skipped BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'bronce',
  ADD COLUMN IF NOT EXISTS subscription_billing_cycle VARCHAR(20) DEFAULT 'annual',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TEXT;

-- 3) Ampliar columnas que quedaron con VARCHAR(22) en instalaciones anteriores
ALTER TABLE public.profiles
  ALTER COLUMN cbu TYPE TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN account_type TYPE TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN billing_preference TYPE TEXT;
