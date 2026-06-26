-- =====================================================
-- SCHEMA: Sistema de Reembolsos
-- Fecha: 2026-01-09
-- Descripción: Gestión de reembolsos y devoluciones
-- =====================================================

-- =====================================================
-- TABLA: refunds (Solicitudes de reembolso)
-- =====================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencias
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Quién solicita
  requested_by VARCHAR(20) NOT NULL CHECK (requested_by IN ('user', 'driver', 'admin', 'system')),

  -- Motivo
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'cancelled_before_assignment',  -- Cancelación antes de asignar conductor
    'cancelled_after_assignment',   -- Cancelación después de asignar
    'cancelled_driver_enroute',     -- Cancelación con conductor en camino
    'driver_no_show',               -- No show del conductor
    'user_no_show',                 -- No show del usuario
    'service_not_completed',        -- Servicio no completado
    'poor_service',                 -- Servicio de mala calidad
    'overcharge',                   -- Cobro excesivo
    'duplicate_charge',             -- Cobro duplicado
    'technical_error',              -- Error técnico
    'other'                         -- Otro motivo
  )),
  reason_details TEXT,

  -- Montos
  original_amount DECIMAL(12,2) NOT NULL,
  refund_amount DECIMAL(12,2) NOT NULL,
  refund_percentage DECIMAL(5,2), -- Porcentaje del reembolso (100%, 80%, 50%, etc)

  -- Tipo de reembolso
  refund_type VARCHAR(20) NOT NULL CHECK (refund_type IN ('full', 'partial')),
  refund_method VARCHAR(20) CHECK (refund_method IN ('original_payment', 'wallet', 'bank_transfer')),

  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Pendiente de revisión
    'approved',     -- Aprobado, pendiente de procesar
    'processing',   -- En proceso de reembolso
    'completed',    -- Reembolso completado
    'rejected',     -- Rechazado
    'failed',       -- Falló el proceso
    'cancelled'     -- Cancelado por el usuario
  )),

  -- Revisión (admin)
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- MercadoPago
  mp_refund_id VARCHAR(100),
  mp_refund_status VARCHAR(50),

  -- Wallet (si aplica)
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),

  -- Metadatos
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_ride ON refunds(ride_id);
CREATE INDEX IF NOT EXISTS idx_refunds_delivery ON refunds(delivery_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_pending ON refunds(status) WHERE status IN ('pending', 'approved', 'processing');

-- =====================================================
-- TABLA: refund_policies (Políticas de reembolso)
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason VARCHAR(50) NOT NULL,
  refund_percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_auto_approved BOOLEAN DEFAULT false, -- Si se aprueba automáticamente
  max_days_to_request INTEGER DEFAULT 7,  -- Días máximos para solicitar
  min_amount_for_bank DECIMAL(12,2) DEFAULT 100.00, -- Mínimo para reembolso bancario
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por motivo
CREATE INDEX IF NOT EXISTS idx_refund_policies_reason ON refund_policies(reason, is_active);

-- =====================================================
-- DATOS INICIALES: Políticas de reembolso
-- =====================================================
INSERT INTO refund_policies (reason, refund_percentage, description, is_auto_approved)
VALUES
  ('cancelled_before_assignment', 100.00, 'Cancelación antes de asignar conductor - Reembolso total', true),
  ('cancelled_after_assignment', 80.00, 'Cancelación después de asignar conductor - 80% del monto', false),
  ('cancelled_driver_enroute', 50.00, 'Cancelación con conductor en camino - 50% del monto', false),
  ('driver_no_show', 100.00, 'No show del conductor - Reembolso total', true),
  ('user_no_show', 0.00, 'No show del usuario - Sin reembolso', false),
  ('service_not_completed', 100.00, 'Servicio no completado - Reembolso proporcional', false),
  ('poor_service', 50.00, 'Servicio de mala calidad - Hasta 50%', false),
  ('overcharge', 100.00, 'Cobro excesivo - Diferencia del monto', true),
  ('duplicate_charge', 100.00, 'Cobro duplicado - Reembolso total del duplicado', true),
  ('technical_error', 100.00, 'Error técnico - Reembolso total', true),
  ('other', 0.00, 'Otro motivo - Requiere revisión manual', false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para calcular monto de reembolso según política
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_original_amount DECIMAL,
  p_reason VARCHAR
)
RETURNS TABLE (
  refund_amount DECIMAL,
  refund_percentage DECIMAL,
  is_auto_approved BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_policy refund_policies%ROWTYPE;
BEGIN
  -- Obtener política vigente
  SELECT * INTO v_policy
  FROM refund_policies
  WHERE reason = p_reason
    AND is_active = true
  LIMIT 1;

  -- Si no hay política, usar 0%
  IF v_policy IS NULL THEN
    RETURN QUERY SELECT
      0::DECIMAL as refund_amount,
      0::DECIMAL as refund_percentage,
      false as is_auto_approved;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    ROUND(p_original_amount * (v_policy.refund_percentage / 100), 2) as refund_amount,
    v_policy.refund_percentage as refund_percentage,
    v_policy.is_auto_approved as is_auto_approved;
END;
$$;

-- Función para obtener estadísticas de reembolsos
CREATE OR REPLACE FUNCTION get_refund_stats(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  total_approved BIGINT,
  total_rejected BIGINT,
  total_completed BIGINT,
  total_amount_refunded DECIMAL,
  average_refund_amount DECIMAL,
  approval_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    COUNT(*) FILTER (WHERE status IN ('approved', 'processing', 'completed'))::BIGINT as total_approved,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as total_rejected,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as total_completed,
    COALESCE(SUM(refund_amount) FILTER (WHERE status = 'completed'), 0) as total_amount_refunded,
    COALESCE(AVG(refund_amount) FILTER (WHERE status = 'completed'), 0) as average_refund_amount,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status IN ('approved', 'processing', 'completed'))::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END as approval_rate
  FROM refunds
  WHERE (p_date_from IS NULL OR created_at >= p_date_from)
    AND (p_date_to IS NULL OR created_at <= p_date_to);
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refund_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;

-- Políticas para refunds (usuarios ven los suyos)
CREATE POLICY "Users can view own refunds"
ON refunds FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create refunds"
ON refunds FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para refund_policies (lectura pública)
CREATE POLICY "Refund policies visible to all"
ON refund_policies FOR SELECT
USING (is_active = true);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE refunds IS 'Solicitudes de reembolso de usuarios';
COMMENT ON TABLE refund_policies IS 'Políticas de reembolso por tipo de cancelación';
COMMENT ON FUNCTION calculate_refund_amount IS 'Calcula el monto de reembolso según la política';
COMMENT ON FUNCTION get_refund_stats IS 'Obtiene estadísticas de reembolsos para admin';
