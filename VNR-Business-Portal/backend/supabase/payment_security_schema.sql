-- =====================================================
-- SCHEMA: Seguridad y Auditoría de Pagos
-- Fecha: 2026-01-09
-- Descripción: Tablas para logging, auditoría y seguridad
-- =====================================================

-- =====================================================
-- TABLA: payment_audit_logs (Logs de auditoría de pagos)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL,

  -- Referencias
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Información de la petición
  ip_address VARCHAR(45), -- Soporta IPv6
  user_agent TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),

  -- Detalles del evento
  details JSONB DEFAULT '{}',

  -- Resultado
  status_code INTEGER,
  success BOOLEAN,
  error_message TEXT,

  -- Duración
  duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_audit_user ON payment_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_payment ON payment_audit_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON payment_audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON payment_audit_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON payment_audit_logs(created_at DESC);

-- Índice parcial para eventos de seguridad importantes
CREATE INDEX IF NOT EXISTS idx_audit_security_events ON payment_audit_logs(created_at DESC)
WHERE event_type IN (
  'rate_limit_exceeded',
  'webhook_signature_mismatch',
  'unauthorized_payment_attempt',
  'duplicate_payment_prevented',
  'amount_mismatch'
);

-- =====================================================
-- TABLA: webhook_logs (Logs de webhooks recibidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Origen
  source VARCHAR(50) NOT NULL, -- 'mercadopago', 'other'

  -- Identificadores
  external_id VARCHAR(255), -- ID externo (mp_payment_id, etc)
  request_id VARCHAR(255),  -- X-Request-Id del header

  -- Tipo y datos
  event_type VARCHAR(100),
  payload JSONB NOT NULL,

  -- Headers relevantes
  signature VARCHAR(500),
  headers JSONB,

  -- Validación
  signature_valid BOOLEAN,

  -- Procesamiento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_result JSONB,
  error_message TEXT,

  -- IP
  ip_address VARCHAR(45),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_source ON webhook_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_external ON webhook_logs(external_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_logs(processed, created_at DESC);

-- =====================================================
-- TABLA: payment_idempotency (Control de idempotencia)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_idempotency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Key de idempotencia
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,

  -- Usuario
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Estado
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),

  -- Request original
  request_hash VARCHAR(64), -- SHA256 del request body
  endpoint VARCHAR(255),
  method VARCHAR(10),

  -- Respuesta guardada
  response_status INTEGER,
  response_body JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON payment_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_user ON payment_idempotency(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON payment_idempotency(expires_at);

-- Limpiar registros expirados automáticamente (requiere pg_cron o job externo)
-- DELETE FROM payment_idempotency WHERE expires_at < NOW();

-- =====================================================
-- TABLA: rate_limit_violations (Violaciones de rate limit)
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificación
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),

  -- Endpoint
  endpoint VARCHAR(255),
  key_type VARCHAR(50), -- 'user', 'ip', 'combined'

  -- Contadores
  request_count INTEGER,
  limit_value INTEGER,
  window_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ratelimit_user ON rate_limit_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratelimit_ip ON rate_limit_violations(ip_address, created_at DESC);

-- =====================================================
-- VISTA: security_dashboard (Dashboard de seguridad)
-- =====================================================
CREATE OR REPLACE VIEW security_dashboard AS
SELECT
  -- Últimas 24 horas
  (SELECT COUNT(*) FROM payment_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') as total_events_24h,

  -- Rate limit violations
  (SELECT COUNT(*) FROM rate_limit_violations WHERE created_at > NOW() - INTERVAL '24 hours') as rate_limit_violations_24h,

  -- Webhooks
  (SELECT COUNT(*) FROM webhook_logs WHERE created_at > NOW() - INTERVAL '24 hours') as webhooks_received_24h,
  (SELECT COUNT(*) FROM webhook_logs WHERE created_at > NOW() - INTERVAL '24 hours' AND signature_valid = false) as invalid_webhooks_24h,

  -- Eventos de seguridad específicos
  (SELECT COUNT(*) FROM payment_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = 'unauthorized_payment_attempt') as unauthorized_attempts_24h,
  (SELECT COUNT(*) FROM payment_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = 'duplicate_payment_prevented') as duplicates_prevented_24h,
  (SELECT COUNT(*) FROM payment_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = 'amount_mismatch') as amount_mismatches_24h;

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para obtener estadísticas de seguridad
CREATE OR REPLACE FUNCTION get_security_stats(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  event_type VARCHAR,
  count BIGINT,
  unique_users BIGINT,
  unique_ips BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pal.event_type,
    COUNT(*)::BIGINT as count,
    COUNT(DISTINCT pal.user_id)::BIGINT as unique_users,
    COUNT(DISTINCT pal.ip_address)::BIGINT as unique_ips
  FROM payment_audit_logs pal
  WHERE pal.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY pal.event_type
  ORDER BY count DESC;
END;
$$;

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  p_threshold INTEGER DEFAULT 50, -- Umbral de eventos
  p_hours INTEGER DEFAULT 1       -- Ventana de tiempo
)
RETURNS TABLE (
  user_id UUID,
  ip_address VARCHAR,
  event_count BIGINT,
  event_types TEXT[],
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pal.user_id,
    pal.ip_address,
    COUNT(*)::BIGINT as event_count,
    ARRAY_AGG(DISTINCT pal.event_type) as event_types,
    MIN(pal.created_at) as first_event,
    MAX(pal.created_at) as last_event
  FROM payment_audit_logs pal
  WHERE pal.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY pal.user_id, pal.ip_address
  HAVING COUNT(*) > p_threshold
  ORDER BY event_count DESC;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS (solo admin puede ver logs)
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Solo lectura para admin vía service_role
-- (Los inserts se hacen desde el backend con supabaseAdmin)

-- =====================================================
-- POLÍTICAS DE LIMPIEZA (para job de mantenimiento)
-- =====================================================
-- Ejecutar periódicamente:
-- DELETE FROM payment_audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';
-- DELETE FROM payment_idempotency WHERE expires_at < NOW();
-- DELETE FROM rate_limit_violations WHERE created_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE payment_audit_logs IS 'Logs de auditoría de todas las operaciones de pago';
COMMENT ON TABLE webhook_logs IS 'Logs de todos los webhooks recibidos';
COMMENT ON TABLE payment_idempotency IS 'Control de idempotencia para prevenir doble cobro';
COMMENT ON TABLE rate_limit_violations IS 'Registro de violaciones de rate limit';
COMMENT ON VIEW security_dashboard IS 'Dashboard de métricas de seguridad';
COMMENT ON FUNCTION get_security_stats IS 'Obtiene estadísticas de eventos de seguridad';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Detecta usuarios/IPs con actividad sospechosa';
