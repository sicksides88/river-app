-- =====================================================
-- SCHEMA DE PAGOS PARA VNR - WHAPY
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABLA DE PAGOS PRINCIPALES
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencias al servicio
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,

  -- Participantes
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- MercadoPago
  mp_payment_id VARCHAR(100),
  mp_preference_id VARCHAR(100),
  mp_status VARCHAR(50),
  mp_status_detail VARCHAR(100),
  mp_payment_method_id VARCHAR(50),
  mp_payment_type_id VARCHAR(50),

  -- Montos
  amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) DEFAULT 0,
  driver_amount DECIMAL(12,2) DEFAULT 0,
  tip_amount DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ARS',

  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, processing, approved, rejected, refunded, cancelled

  -- Metodo de pago
  payment_method VARCHAR(30),
  -- Metodos: card, wallet, mercadopago, cash

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,

  -- Constraint para asegurar que tiene al menos una referencia
  CONSTRAINT valid_service_reference CHECK (
    ride_id IS NOT NULL OR delivery_id IS NOT NULL OR metadata->>'type' = 'wallet_deposit'
  )
);

-- Indices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_driver ON payments(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_ride ON payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_delivery ON payments(delivery_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id ON payments(mp_payment_id);

-- =====================================================
-- 2. WALLET DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Saldos
  balance DECIMAL(12,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'ARS',

  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para user_wallets
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);

-- =====================================================
-- 3. TRANSACCIONES DE WALLET
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES user_wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Tipo de transaccion
  type VARCHAR(20) NOT NULL,
  -- Tipos: deposit, withdrawal, payment, refund, bonus, transfer

  -- Montos
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, completed, failed, cancelled

  -- Referencias
  reference_type VARCHAR(50),
  -- Tipos: ride, delivery, mercadopago, bank_transfer, manual, promotion
  reference_id UUID,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON wallet_transactions(status);

-- =====================================================
-- 4. WALLET DE CONDUCTORES
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Saldos
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  pending_balance DECIMAL(12,2) DEFAULT 0.00,
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'ARS',

  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para driver_wallets
CREATE INDEX IF NOT EXISTS idx_driver_wallets_driver ON driver_wallets(driver_id);

-- =====================================================
-- 5. GANANCIAS DE CONDUCTORES
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES driver_wallets(id) ON DELETE CASCADE NOT NULL,

  -- Referencias
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- Montos
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  tip_amount DECIMAL(12,2) DEFAULT 0,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, available, withdrawn

  -- Fecha de disponibilidad (72 horas despues)
  available_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para driver_earnings
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON driver_earnings(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON driver_earnings(status);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_available ON driver_earnings(available_at) WHERE status = 'pending';

-- =====================================================
-- 6. RETIROS DE CONDUCTORES
-- =====================================================
CREATE TABLE IF NOT EXISTS driver_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES driver_wallets(id) ON DELETE CASCADE NOT NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,

  -- Montos
  amount DECIMAL(12,2) NOT NULL,
  fee DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, processing, completed, failed, cancelled

  -- Razon de fallo
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indices para driver_withdrawals
CREATE INDEX IF NOT EXISTS idx_driver_withdrawals_driver ON driver_withdrawals(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_withdrawals_status ON driver_withdrawals(status);

-- =====================================================
-- 7. CUENTAS BANCARIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Datos del banco
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  -- Tipos: savings, checking

  -- Datos de la cuenta
  account_number VARCHAR(50),
  cbu VARCHAR(22),
  alias VARCHAR(50),

  -- Datos del titular
  holder_name VARCHAR(100) NOT NULL,
  holder_cuit VARCHAR(15),

  -- Estado
  is_verified BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);

-- =====================================================
-- 8. CONFIGURACION DE COMISIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de servicio
  service_type VARCHAR(50) NOT NULL,
  -- Tipos: vuelta_segura, envios, fletes, chofer

  -- Porcentajes
  platform_percentage DECIMAL(5,2) NOT NULL,
  driver_percentage DECIMAL(5,2) NOT NULL,

  -- Limites
  min_platform_fee DECIMAL(12,2) DEFAULT 0,
  max_platform_fee DECIMAL(12,2),

  -- Vigencia
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para commission_settings
CREATE INDEX IF NOT EXISTS idx_commission_settings_service ON commission_settings(service_type, is_active);

-- Insertar comisiones por defecto
INSERT INTO commission_settings (service_type, platform_percentage, driver_percentage, min_platform_fee) VALUES
  ('vuelta_segura', 20.00, 80.00, 50.00),
  ('envios', 18.00, 82.00, 30.00),
  ('fletes', 15.00, 85.00, 100.00),
  ('chofer', 20.00, 80.00, 100.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. REEMBOLSOS
-- =====================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,

  -- Referencias
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Solicitante
  requested_by VARCHAR(20) NOT NULL,
  -- Tipos: user, driver, admin, system

  -- Motivo
  reason VARCHAR(50) NOT NULL,
  -- Razones: cancelled, no_show, poor_service, overcharge, duplicate, other
  reason_details TEXT,

  -- Montos
  original_amount DECIMAL(12,2) NOT NULL,
  refund_amount DECIMAL(12,2) NOT NULL,
  refund_type VARCHAR(20) NOT NULL,
  -- Tipos: full, partial

  -- Metodo de reembolso
  refund_method VARCHAR(30) NOT NULL,
  -- Metodos: original_payment, wallet, bank_transfer

  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, approved, processing, completed, rejected

  -- Revision
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- MercadoPago
  mp_refund_id VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indices para refunds
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- =====================================================
-- 10. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Funcion para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_wallets_updated_at ON driver_wallets;
CREATE TRIGGER update_driver_wallets_updated_at
  BEFORE UPDATE ON driver_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Politicas para payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = driver_id);

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politicas para user_wallets
CREATE POLICY "Users can view own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Politicas para wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Politicas para driver_wallets
CREATE POLICY "Drivers can view own wallet" ON driver_wallets
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own wallet" ON driver_wallets
  FOR UPDATE USING (auth.uid() = driver_id);

-- Politicas para driver_earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings
  FOR SELECT USING (auth.uid() = driver_id);

-- Politicas para driver_withdrawals
CREATE POLICY "Drivers can view own withdrawals" ON driver_withdrawals
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create withdrawals" ON driver_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Politicas para bank_accounts
CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Politicas para refunds
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request refunds" ON refunds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FIN DEL SCHEMA DE PAGOS
-- =====================================================
