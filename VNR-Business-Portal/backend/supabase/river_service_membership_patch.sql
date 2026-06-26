-- River Service: vínculo, onboarding y datos de membresía en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cuit_cuil VARCHAR(20),
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
  ADD COLUMN IF NOT EXISTS membership_skipped BOOLEAN DEFAULT FALSE;

-- Bucket para pólizas (crear desde backend al subir; opcional manual):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('policy-documents', 'policy-documents', false);
