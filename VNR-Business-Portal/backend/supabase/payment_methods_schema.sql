-- ============================================
-- Schema para Métodos de Pago Guardados
-- ============================================

-- Tabla principal de métodos de pago guardados
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tipo de método de pago
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('card', 'mercadopago', 'debit_card')),

  -- Información de tarjeta (tokenizada, nunca guardamos el número completo)
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  card_expiry_month INTEGER CHECK (card_expiry_month >= 1 AND card_expiry_month <= 12),
  card_expiry_year INTEGER,
  cardholder_name VARCHAR(255),

  -- Token de MercadoPago (para procesar pagos sin re-ingresar datos)
  mp_card_token_id VARCHAR(255),
  mp_payment_method_id VARCHAR(50),
  mp_customer_id VARCHAR(255),

  -- Metadata adicional
  billing_address JSONB DEFAULT '{}',

  -- Estado
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted', 'pending_verification')),

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_status ON saved_payment_methods(status);

-- Índice único parcial: solo UN método default por usuario (activo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_payment_per_user
ON saved_payment_methods (user_id)
WHERE is_default = TRUE AND status = 'active';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_saved_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_payment_methods ON saved_payment_methods;
CREATE TRIGGER trigger_update_saved_payment_methods
  BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_payment_methods_updated_at();

-- Función para asegurar solo un método default por usuario (solo activos)
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment ON saved_payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment
  BEFORE INSERT OR UPDATE ON saved_payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios métodos de pago
DROP POLICY IF EXISTS "Users can view own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can view own payment methods" ON saved_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar sus propios métodos de pago
DROP POLICY IF EXISTS "Users can insert own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can insert own payment methods" ON saved_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propios métodos de pago
DROP POLICY IF EXISTS "Users can update own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can update own payment methods" ON saved_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios métodos de pago
DROP POLICY IF EXISTS "Users can delete own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can delete own payment methods" ON saved_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role tiene acceso completo (para operaciones del backend)
DROP POLICY IF EXISTS "Service role has full access to payment methods" ON saved_payment_methods;
CREATE POLICY "Service role has full access to payment methods" ON saved_payment_methods
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
