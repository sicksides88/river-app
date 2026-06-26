-- River Service Fase 2: turnos y bases operativas de patrulla
-- Ejecutar en Supabase SQL Editor si las tablas no existen

CREATE TABLE IF NOT EXISTS patrol_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patrol_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_id UUID REFERENCES patrol_bases(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patrol_shifts_driver ON patrol_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_patrol_shifts_active ON patrol_shifts(status, starts_at, ends_at);

COMMENT ON TABLE patrol_bases IS 'Bases operativas River Service para patrullas náuticas';
COMMENT ON TABLE patrol_shifts IS 'Turnos de guardia de patrones (auxilio náutico)';
