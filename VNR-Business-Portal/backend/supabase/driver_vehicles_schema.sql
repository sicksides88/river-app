-- =============================================
-- DRIVER VEHICLES SCHEMA
-- Tabla para almacenar vehículos de conductores
-- =============================================

-- Tabla de vehículos de conductores
CREATE TABLE IF NOT EXISTS driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) DEFAULT 'sedan', -- sedan, suv, van, pickup, motorcycle
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  plate_number VARCHAR(20) NOT NULL,
  capacity INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de documentos de conductores
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- dni_front, dni_back, license_front, license_back, selfie_verification, vehicle_registration, insurance
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de disponibilidad de conductores
CREATE TABLE IF NOT EXISTS driver_availability (
  driver_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT false,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  current_vehicle_id UUID REFERENCES driver_vehicles(id),
  last_location_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de puntos de confianza
CREATE TABLE IF NOT EXISTS trust_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  action_type VARCHAR(50), -- ride_completed, good_rating, cancellation, late_arrival, verification_complete, suspension
  ride_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de niveles de confianza
-- Primero eliminar si existe con estructura incorrecta
DROP TABLE IF EXISTS trust_points_config CASCADE;

CREATE TABLE trust_points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name VARCHAR(50) NOT NULL, -- bronce, plata, oro, platino
  min_points INTEGER NOT NULL,
  max_points INTEGER,
  benefits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración de niveles por defecto
INSERT INTO trust_points_config (level_name, min_points, max_points, benefits) VALUES
  ('bronce', 0, 99, '{"commission_rate": 0.20, "priority": 1}'),
  ('plata', 100, 299, '{"commission_rate": 0.18, "priority": 2}'),
  ('oro', 300, 599, '{"commission_rate": 0.15, "priority": 3}'),
  ('platino', 600, NULL, '{"commission_rate": 0.12, "priority": 4}');

-- Agregar columnas a profiles si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_driver') THEN
    ALTER TABLE profiles ADD COLUMN is_driver BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_status') THEN
    ALTER TABLE profiles ADD COLUMN driver_status VARCHAR(50) DEFAULT NULL; -- pending_documents, pending_review, active, suspended
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_type') THEN
    ALTER TABLE profiles ADD COLUMN driver_type VARCHAR(50) DEFAULT NULL; -- vuelta_segura, fletes, cadete, chofer
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_points') THEN
    ALTER TABLE profiles ADD COLUMN trust_points INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_level') THEN
    ALTER TABLE profiles ADD COLUMN trust_level VARCHAR(20) DEFAULT 'bronce';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_verified_at') THEN
    ALTER TABLE profiles ADD COLUMN driver_verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver_id ON driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_is_active ON driver_vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON driver_documents(status);
CREATE INDEX IF NOT EXISTS idx_driver_availability_is_available ON driver_availability(is_available);
CREATE INDEX IF NOT EXISTS idx_trust_points_log_driver_id ON trust_points_log(driver_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas
DROP TRIGGER IF EXISTS update_driver_vehicles_updated_at ON driver_vehicles;
CREATE TRIGGER update_driver_vehicles_updated_at
  BEFORE UPDATE ON driver_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON driver_documents;
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_availability_updated_at ON driver_availability;
CREATE TRIGGER update_driver_availability_updated_at
  BEFORE UPDATE ON driver_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_points_log ENABLE ROW LEVEL SECURITY;

-- Políticas para driver_vehicles
CREATE POLICY "Users can view their own vehicles" ON driver_vehicles
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Users can insert their own vehicles" ON driver_vehicles
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own vehicles" ON driver_vehicles
  FOR UPDATE USING (auth.uid() = driver_id);

-- Políticas para driver_documents
CREATE POLICY "Users can view their own documents" ON driver_documents
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Users can insert their own documents" ON driver_documents
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Políticas para driver_availability
CREATE POLICY "Users can view their own availability" ON driver_availability
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Users can manage their own availability" ON driver_availability
  FOR ALL USING (auth.uid() = driver_id);

-- Políticas para trust_points_log
CREATE POLICY "Users can view their own trust points" ON trust_points_log
  FOR SELECT USING (auth.uid() = driver_id);

-- Service role puede hacer todo (para el backend)
CREATE POLICY "Service role full access vehicles" ON driver_vehicles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access documents" ON driver_documents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access availability" ON driver_availability
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access trust_points" ON trust_points_log
  FOR ALL USING (auth.role() = 'service_role');
