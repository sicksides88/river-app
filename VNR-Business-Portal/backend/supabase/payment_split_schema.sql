-- =====================================================
-- SCHEMA: División de Pagos (Plataforma/Conductor)
-- Fecha: 2026-01-08
-- Descripción: Gestión de comisiones y división de pagos
-- =====================================================

-- =====================================================
-- TABLA: commission_settings (Configuración de comisiones)
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type VARCHAR(50) NOT NULL, -- 'vuelta-segura', 'chofer', 'envio', 'flete'
  platform_percentage DECIMAL(5,2) NOT NULL, -- Porcentaje plataforma (ej: 20.00 = 20%)
  driver_percentage DECIMAL(5,2) NOT NULL,   -- Porcentaje conductor (ej: 80.00 = 80%)
  min_platform_fee DECIMAL(12,2) DEFAULT 0,  -- Comisión mínima plataforma
  max_platform_fee DECIMAL(12,2),            -- Comisión máxima (opcional)
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,               -- NULL = sin fecha de expiración
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índice para búsqueda por tipo de servicio
CREATE INDEX IF NOT EXISTS idx_commission_service_type
ON commission_settings(service_type, is_active);

-- Constraint: porcentajes deben sumar 100
ALTER TABLE commission_settings
ADD CONSTRAINT check_percentages_sum
CHECK (platform_percentage + driver_percentage = 100.00);

-- =====================================================
-- TABLA: payment_splits (Registro de divisiones)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencias
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  commission_setting_id UUID REFERENCES commission_settings(id),

  -- Tipo de servicio
  service_type VARCHAR(50) NOT NULL,

  -- Montos
  total_amount DECIMAL(12,2) NOT NULL,        -- Monto total del viaje/envío
  platform_amount DECIMAL(12,2) NOT NULL,     -- Comisión plataforma
  platform_percentage DECIMAL(5,2) NOT NULL,  -- % aplicado a plataforma
  driver_amount DECIMAL(12,2) NOT NULL,       -- Ganancia conductor (sin propina)
  driver_percentage DECIMAL(5,2) NOT NULL,    -- % aplicado a conductor

  -- Propina (va 100% al conductor)
  tip_amount DECIMAL(12,2) DEFAULT 0,
  tip_percentage DECIMAL(5,2),                -- % de propina sobre total (para registro)

  -- Total final conductor (driver_amount + tip_amount)
  driver_total DECIMAL(12,2) NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),

  -- Metadatos
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_splits_driver ON payment_splits(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_splits_payment ON payment_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_splits_ride ON payment_splits(ride_id);
CREATE INDEX IF NOT EXISTS idx_splits_delivery ON payment_splits(delivery_id);
CREATE INDEX IF NOT EXISTS idx_splits_status ON payment_splits(status);
CREATE INDEX IF NOT EXISTS idx_splits_service ON payment_splits(service_type, created_at DESC);

-- =====================================================
-- TABLA: tips (Propinas)
-- =====================================================
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencias
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payment_split_id UUID REFERENCES payment_splits(id) ON DELETE SET NULL,

  -- Monto
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),  -- Si fue % del total (10%, 15%, 20%)

  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Pago
  payment_method VARCHAR(20), -- 'wallet', 'mercadopago'
  payment_id UUID REFERENCES payments(id),

  -- Metadatos
  message TEXT,  -- Mensaje opcional del usuario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tips_driver ON tips(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_ride ON tips(ride_id);
CREATE INDEX IF NOT EXISTS idx_tips_delivery ON tips(delivery_id);

-- =====================================================
-- DATOS INICIALES: Configuración de comisiones
-- =====================================================
INSERT INTO commission_settings (service_type, platform_percentage, driver_percentage, min_platform_fee, description)
VALUES
  ('vuelta-segura', 20.00, 80.00, 50.00, 'Servicio Vuelta Segura - Viajes estándar'),
  ('chofer', 20.00, 80.00, 100.00, 'Servicio Chofer - Conductor por hora'),
  ('envio', 18.00, 82.00, 30.00, 'Servicio de Envíos - Paquetería'),
  ('flete', 15.00, 85.00, 150.00, 'Servicio de Fletes - Mudanzas y cargas')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para calcular división de pago
CREATE OR REPLACE FUNCTION calculate_payment_split(
  p_amount DECIMAL,
  p_service_type VARCHAR
)
RETURNS TABLE (
  platform_amount DECIMAL,
  platform_percentage DECIMAL,
  driver_amount DECIMAL,
  driver_percentage DECIMAL,
  commission_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_commission commission_settings%ROWTYPE;
  v_platform_fee DECIMAL;
BEGIN
  -- Obtener configuración de comisión vigente
  SELECT * INTO v_commission
  FROM commission_settings
  WHERE service_type = p_service_type
    AND is_active = true
    AND effective_from <= NOW()
    AND (effective_until IS NULL OR effective_until > NOW())
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Si no hay configuración, usar valores por defecto (20/80)
  IF v_commission IS NULL THEN
    RETURN QUERY SELECT
      ROUND(p_amount * 0.20, 2)::DECIMAL as platform_amount,
      20.00::DECIMAL as platform_percentage,
      ROUND(p_amount * 0.80, 2)::DECIMAL as driver_amount,
      80.00::DECIMAL as driver_percentage,
      NULL::UUID as commission_id;
    RETURN;
  END IF;

  -- Calcular comisión plataforma
  v_platform_fee := ROUND(p_amount * (v_commission.platform_percentage / 100), 2);

  -- Aplicar mínimo si corresponde
  IF v_commission.min_platform_fee IS NOT NULL AND v_platform_fee < v_commission.min_platform_fee THEN
    v_platform_fee := v_commission.min_platform_fee;
  END IF;

  -- Aplicar máximo si corresponde
  IF v_commission.max_platform_fee IS NOT NULL AND v_platform_fee > v_commission.max_platform_fee THEN
    v_platform_fee := v_commission.max_platform_fee;
  END IF;

  RETURN QUERY SELECT
    v_platform_fee as platform_amount,
    v_commission.platform_percentage as platform_percentage,
    (p_amount - v_platform_fee) as driver_amount,
    v_commission.driver_percentage as driver_percentage,
    v_commission.id as commission_id;
END;
$$;

-- Función para obtener resumen de ganancias de plataforma
CREATE OR REPLACE FUNCTION get_platform_earnings_summary(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  service_type VARCHAR,
  total_rides BIGINT,
  total_amount DECIMAL,
  total_platform_earnings DECIMAL,
  total_driver_earnings DECIMAL,
  total_tips DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.service_type,
    COUNT(*)::BIGINT as total_rides,
    SUM(ps.total_amount) as total_amount,
    SUM(ps.platform_amount) as total_platform_earnings,
    SUM(ps.driver_amount) as total_driver_earnings,
    SUM(ps.tip_amount) as total_tips
  FROM payment_splits ps
  WHERE ps.status IN ('processed', 'paid')
    AND (p_date_from IS NULL OR ps.created_at >= p_date_from)
    AND (p_date_to IS NULL OR ps.created_at <= p_date_to)
  GROUP BY ps.service_type;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Políticas para commission_settings (solo lectura para todos)
CREATE POLICY "Commission settings visible para todos"
ON commission_settings FOR SELECT
USING (is_active = true);

-- Políticas para payment_splits (conductor ve los suyos)
CREATE POLICY "Drivers can view own splits"
ON payment_splits FOR SELECT
USING (auth.uid() = driver_id);

-- Políticas para tips (conductor y usuario ven los suyos)
CREATE POLICY "Users can view own tips"
ON tips FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = driver_id);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE commission_settings IS 'Configuración de comisiones por tipo de servicio';
COMMENT ON TABLE payment_splits IS 'Registro de división de pagos entre plataforma y conductor';
COMMENT ON TABLE tips IS 'Registro de propinas de usuarios a conductores';
COMMENT ON FUNCTION calculate_payment_split IS 'Calcula la división de un pago según el tipo de servicio';
COMMENT ON FUNCTION get_platform_earnings_summary IS 'Obtiene resumen de ganancias de la plataforma';
