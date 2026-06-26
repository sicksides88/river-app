-- =====================================================
-- SCHEMA: Historial de Transacciones Unificado
-- Fecha: 2026-01-08
-- Descripcion: Vista unificada de todas las transacciones
-- =====================================================

-- Vista unificada de todas las transacciones (usuarios)
CREATE OR REPLACE VIEW all_transactions AS
SELECT
  wt.id,
  wt.user_id,
  wt.wallet_id,
  wt.type,
  wt.amount,
  wt.balance_before,
  wt.balance_after,
  wt.status,
  wt.reference_type,
  wt.reference_id,
  wt.payment_id,
  wt.description,
  wt.metadata,
  wt.created_at,
  'wallet' as source,
  -- Informacion del viaje (si aplica)
  r.pickup_address as ride_pickup_address,
  r.dropoff_address as ride_dropoff_address,
  r.distance as ride_distance,
  r.estimated_price as ride_price,
  r.status as ride_status,
  -- Informacion del envio (si aplica)
  d.pickup_address as delivery_pickup_address,
  d.dropoff_address as delivery_dropoff_address,
  d.package_description,
  d.estimated_price as delivery_price,
  d.status as delivery_status,
  -- Informacion del pago (si aplica)
  p.payment_method,
  p.mp_payment_id,
  p.mp_preference_id
FROM wallet_transactions wt
LEFT JOIN rides r ON wt.reference_type = 'ride' AND wt.reference_id = r.id
LEFT JOIN deliveries d ON wt.reference_type = 'delivery' AND wt.reference_id = d.id
LEFT JOIN payments p ON wt.payment_id = p.id;

-- Vista de resumen de transacciones por periodo
CREATE OR REPLACE VIEW transaction_summary AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) as period_day,
  DATE_TRUNC('week', created_at) as period_week,
  DATE_TRUNC('month', created_at) as period_month,
  type,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(amount) as net_amount
FROM wallet_transactions
WHERE status = 'completed'
GROUP BY user_id, DATE_TRUNC('day', created_at), DATE_TRUNC('week', created_at), DATE_TRUNC('month', created_at), type;

-- Indices para mejorar performance en consultas de historial
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created
ON wallet_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_type_status
ON wallet_transactions(type, status);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference
ON wallet_transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_amount_range
ON wallet_transactions(amount);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at
ON wallet_transactions(created_at DESC);

-- Funcion para obtener resumen de transacciones
CREATE OR REPLACE FUNCTION get_transaction_summary(
  p_user_id UUID,
  p_period VARCHAR DEFAULT 'month' -- 'day', 'week', 'month', 'year'
)
RETURNS TABLE (
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_deposits DECIMAL,
  total_withdrawals DECIMAL,
  total_payments DECIMAL,
  total_refunds DECIMAL,
  net_balance DECIMAL,
  transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC(p_period, NOW()) as period_start,
    DATE_TRUNC(p_period, NOW()) + ('1 ' || p_period)::INTERVAL as period_end,
    COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN type = 'withdrawal' AND status = 'completed' THEN ABS(amount) ELSE 0 END), 0) as total_withdrawals,
    COALESCE(SUM(CASE WHEN type = 'payment' AND status = 'completed' THEN ABS(amount) ELSE 0 END), 0) as total_payments,
    COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_refunds,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as net_balance,
    COUNT(*) as transaction_count
  FROM wallet_transactions
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC(p_period, NOW())
    AND created_at < DATE_TRUNC(p_period, NOW()) + ('1 ' || p_period)::INTERVAL;
END;
$$;

-- Comentarios de documentacion
COMMENT ON VIEW all_transactions IS 'Vista unificada de todas las transacciones con informacion relacionada de viajes, envios y pagos';
COMMENT ON VIEW transaction_summary IS 'Resumen agregado de transacciones por periodo y tipo';
COMMENT ON FUNCTION get_transaction_summary IS 'Obtiene resumen de transacciones de un usuario para un periodo especifico';
