-- ============================================
-- VNR CRM - Tablas para Auditoria, Tarifas y Pagos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. AUDIT LOGS (Auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'driver_approved', 'driver_rejected', 'driver_suspended', 'driver_reactivated',
    'document_approved', 'document_rejected',
    'user_suspended', 'user_reactivated',
    'rate_created', 'rate_updated', 'rate_deleted',
    'rule_created', 'rule_updated', 'rule_deleted',
    'order_status_changed',
    'ride_cancelled', 'delivery_cancelled',
    'settlement_paid'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'profile', 'driver_document', 'service_rate', 'price_rule',
    'order', 'ride', 'delivery', 'driver_settlement'
  )),
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);


-- ============================================
-- 2. SERVICE RATES (Tarifas por servicio)
-- ============================================

CREATE TABLE IF NOT EXISTS service_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('vuelta_segura', 'chofer', 'envios', 'fletes')),
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_unit_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('km', 'hora')) DEFAULT 'km',
  minimum_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_rates_service_type ON service_rates(service_type);
CREATE INDEX IF NOT EXISTS idx_service_rates_is_active ON service_rates(is_active);

-- RLS
ALTER TABLE service_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_rates_select" ON service_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_rates_all" ON service_rates FOR ALL TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_service_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_service_rates_updated_at
  BEFORE UPDATE ON service_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rates_updated_at();

-- Datos iniciales
INSERT INTO service_rates (service_type, base_rate, per_unit_rate, unit_type, minimum_price) VALUES
  ('vuelta_segura', 500, 150, 'km', 1500),
  ('chofer', 2000, 1500, 'hora', 2000),
  ('envios', 300, 100, 'km', 800),
  ('fletes', 1000, 200, 'km', 3000)
ON CONFLICT (service_type) DO NOTHING;


-- ============================================
-- 3. PRICE RULES (Reglas de precio)
-- ============================================

CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('surcharge', 'discount')),
  percentage NUMERIC(5,2) NOT NULL,
  applies_to TEXT[] DEFAULT ARRAY['vuelta_segura', 'chofer', 'envios', 'fletes'],
  conditions JSONB DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_rules_is_active ON price_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_price_rules_rule_type ON price_rules(rule_type);

-- RLS
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_rules_select" ON price_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "price_rules_all" ON price_rules FOR ALL TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_price_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_price_rules_updated_at
  BEFORE UPDATE ON price_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_price_rules_updated_at();

-- Datos iniciales
INSERT INTO price_rules (name, description, rule_type, percentage, conditions) VALUES
  ('Recargo nocturno', 'Aplica entre las 22:00 y 06:00', 'surcharge', 20, '{"time_start": "22:00", "time_end": "06:00"}'),
  ('Recargo fin de semana', 'Aplica sabados y domingos', 'surcharge', 15, '{"days": ["saturday", "sunday"]}'),
  ('Recargo feriados', 'Aplica en feriados nacionales', 'surcharge', 30, '{"holidays": true}'),
  ('Descuento usuario frecuente', 'Usuarios con 10+ viajes/mes', 'discount', 10, '{"min_trips_month": 10}')
ON CONFLICT DO NOTHING;


-- ============================================
-- 4. DRIVER SETTLEMENTS (Liquidaciones)
-- ============================================

CREATE TABLE IF NOT EXISTS driver_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('ride', 'delivery')),
  reference_id UUID NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  commission_amount NUMERIC(10,2) NOT NULL,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_settlements_driver_id ON driver_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_status ON driver_settlements(status);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_reference ON driver_settlements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_created_at ON driver_settlements(created_at DESC);

-- RLS
ALTER TABLE driver_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_settlements_select" ON driver_settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "driver_settlements_all" ON driver_settlements FOR ALL TO authenticated USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_driver_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_driver_settlements_updated_at
  BEFORE UPDATE ON driver_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_settlements_updated_at();


-- ============================================
-- FIN DEL SCRIPT
-- ============================================
