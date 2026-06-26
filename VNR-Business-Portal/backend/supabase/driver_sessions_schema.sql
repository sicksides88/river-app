-- =====================================================
-- SCHEMA DE SESIONES DE CONDUCTOR PARA VNR - WHAPY
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. AGREGAR COLUMNA POINTS A PROFILES
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- =====================================================
-- 2. TABLA DE SESIONES DE CONDUCTOR
-- Registra cuando el conductor se conecta/desconecta
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Timestamps de la sesion
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Duracion en minutos (calculada al cerrar sesion)
  duration_minutes INTEGER,

  -- Estado de la sesion
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'forced_end')),

  -- Metadata
  device_info JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para driver_sessions
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver ON driver_sessions(driver_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_status ON driver_sessions(status);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_active ON driver_sessions(driver_id) WHERE status = 'active';

-- =====================================================
-- 3. FUNCION PARA CERRAR SESION
-- =====================================================
CREATE OR REPLACE FUNCTION close_driver_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
    NEW.status = 'ended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duracion al cerrar sesion
DROP TRIGGER IF EXISTS calculate_session_duration ON driver_sessions;
CREATE TRIGGER calculate_session_duration
  BEFORE UPDATE ON driver_sessions
  FOR EACH ROW EXECUTE FUNCTION close_driver_session();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE driver_sessions ENABLE ROW LEVEL SECURITY;

-- Politicas para driver_sessions
CREATE POLICY "Drivers can view own sessions" ON driver_sessions
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create own sessions" ON driver_sessions
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own active sessions" ON driver_sessions
  FOR UPDATE USING (auth.uid() = driver_id AND status = 'active');

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
