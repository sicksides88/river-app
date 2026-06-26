-- =====================================================
-- SCHEMA: Driver MercadoPago Accounts (OAuth)
-- Fecha: 2026-02-10
-- Descripción: Almacena credenciales OAuth de MP de drivers
-- =====================================================

-- =====================================================
-- TABLA: driver_mp_accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_mp_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Datos de MercadoPago
  mp_user_id VARCHAR(50) NOT NULL,
  mp_email VARCHAR(255),

  -- Tokens OAuth
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Estado de la conexión
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'error')),

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_refresh_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,

  -- Metadata
  public_key VARCHAR(100),
  scopes TEXT[], -- Permisos otorgados
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_driver_id
ON driver_mp_accounts(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_status
ON driver_mp_accounts(status);

CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_token_expires
ON driver_mp_accounts(token_expires_at)
WHERE status = 'active';

-- =====================================================
-- ALTERACIONES: payment_splits (agregar campos MP)
-- =====================================================
ALTER TABLE payment_splits
ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);

ALTER TABLE payment_splits
ADD COLUMN IF NOT EXISTS mp_application_fee DECIMAL(12,2);

ALTER TABLE payment_splits
ADD COLUMN IF NOT EXISTS mp_collector_id VARCHAR(50);

ALTER TABLE payment_splits
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'platform'
CHECK (payment_type IN ('platform', 'split'));

-- Índice para pagos con split
CREATE INDEX IF NOT EXISTS idx_splits_mp_payment
ON payment_splits(mp_payment_id)
WHERE mp_payment_id IS NOT NULL;

-- =====================================================
-- TRIGGER: Actualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_driver_mp_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_driver_mp_accounts_updated_at ON driver_mp_accounts;
CREATE TRIGGER trigger_driver_mp_accounts_updated_at
  BEFORE UPDATE ON driver_mp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_mp_accounts_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE driver_mp_accounts ENABLE ROW LEVEL SECURITY;

-- Driver solo puede ver su propia cuenta
CREATE POLICY "Drivers can view own MP account"
ON driver_mp_accounts FOR SELECT
USING (auth.uid() = driver_id);

-- Driver solo puede actualizar su propia cuenta
CREATE POLICY "Drivers can update own MP account"
ON driver_mp_accounts FOR UPDATE
USING (auth.uid() = driver_id);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener tokens que necesitan refresh (próximos a expirar)
CREATE OR REPLACE FUNCTION get_tokens_to_refresh(
  p_minutes_before_expiry INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  driver_id UUID,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dma.id,
    dma.driver_id,
    dma.refresh_token,
    dma.token_expires_at
  FROM driver_mp_accounts dma
  WHERE dma.status = 'active'
    AND dma.token_expires_at <= (NOW() + (p_minutes_before_expiry || ' minutes')::INTERVAL);
END;
$$;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE driver_mp_accounts IS 'Credenciales OAuth de MercadoPago para conductores';
COMMENT ON COLUMN driver_mp_accounts.mp_user_id IS 'ID del usuario en MercadoPago';
COMMENT ON COLUMN driver_mp_accounts.access_token IS 'Token de acceso para operaciones con MP';
COMMENT ON COLUMN driver_mp_accounts.refresh_token IS 'Token para renovar el access_token';
COMMENT ON COLUMN driver_mp_accounts.status IS 'Estado de la conexión: active, disconnected, expired, error';
COMMENT ON COLUMN payment_splits.mp_payment_id IS 'ID del pago en MercadoPago (para split payments)';
COMMENT ON COLUMN payment_splits.mp_application_fee IS 'Comisión cobrada a través de application_fee de MP';
COMMENT ON COLUMN payment_splits.mp_collector_id IS 'ID del collector (driver) en MercadoPago';
COMMENT ON COLUMN payment_splits.payment_type IS 'Tipo de pago: platform (normal) o split (directo a driver)';
