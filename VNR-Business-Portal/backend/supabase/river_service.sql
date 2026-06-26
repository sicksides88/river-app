-- River Service: embarcaciones de navegantes
--
-- IMPORTANTE: Este script NO es standalone.
-- Si tu Supabase está vacío, ejecutá primero:
--   river_service_bootstrap.sql
-- O el schema completo VNR:
--   schema.sql
-- y después este archivo (si bootstrap no incluyó vessels).
--
CREATE TABLE IF NOT EXISTS vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration TEXT NOT NULL,
  type TEXT,
  length_m NUMERIC,
  beam_m NUMERIC,
  engines TEXT,
  base_location TEXT,
  link_type TEXT DEFAULT 'independiente',
  insurance_company TEXT,
  policy_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessels_user_id ON vessels(user_id);

ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;

CREATE POLICY vessels_owner ON vessels
  FOR ALL USING (auth.uid() = user_id);

-- service_type 'auxilio' uses existing rides table with JSON in notes field
