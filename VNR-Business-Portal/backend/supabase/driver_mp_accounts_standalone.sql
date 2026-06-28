-- Solo crea driver_mp_accounts (sin depender de payment_splits)
-- Ejecutar en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS driver_mp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mp_user_id VARCHAR(50) NOT NULL,
  mp_email VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'error')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_refresh_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  public_key VARCHAR(100),
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_driver_id
ON driver_mp_accounts(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_status
ON driver_mp_accounts(status);

CREATE INDEX IF NOT EXISTS idx_driver_mp_accounts_token_expires
ON driver_mp_accounts(token_expires_at)
WHERE status = 'active';

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

ALTER TABLE driver_mp_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own MP account" ON driver_mp_accounts;
CREATE POLICY "Drivers can view own MP account"
ON driver_mp_accounts FOR SELECT
USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can update own MP account" ON driver_mp_accounts;
CREATE POLICY "Drivers can update own MP account"
ON driver_mp_accounts FOR UPDATE
USING (auth.uid() = driver_id);

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

COMMENT ON TABLE driver_mp_accounts IS 'Credenciales OAuth de MercadoPago para conductores';
