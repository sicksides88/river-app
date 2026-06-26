-- ============================================
-- Business Portal Schema
-- ============================================

-- Tabla de comercios
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coordenadas de la dirección del comercio
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_lat DOUBLE PRECISION;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_lng DOUBLE PRECISION;

-- Agregar business_id a deliveries para vincular envios con comercios
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- Index para buscar deliveries por business_id
CREATE INDEX IF NOT EXISTS idx_deliveries_business_id ON deliveries(business_id);

-- Index para buscar business por user_id
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- RLS policies para businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Comercios pueden ver su propio registro
CREATE POLICY "businesses_select_own" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

-- Comercios pueden actualizar su propio registro
CREATE POLICY "businesses_update_own" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins pueden ver todos los comercios
CREATE POLICY "businesses_select_admin" ON businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins pueden actualizar todos los comercios
CREATE POLICY "businesses_update_admin" ON businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role bypass (para backend)
CREATE POLICY "businesses_service_role" ON businesses
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

-- ============================================
-- Tabla de cargos/facturación de comercios
-- ============================================
-- Cada delivery completada genera un cargo al comercio
CREATE TABLE IF NOT EXISTS business_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) NOT NULL,
  delivery_id UUID REFERENCES deliveries(id) NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,            -- Monto total cobrado al comercio
  platform_fee NUMERIC(10,2) DEFAULT 0,     -- Comisión VNR
  driver_amount NUMERIC(10,2) DEFAULT 0,    -- Monto para el cadete
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_charges_business_id ON business_charges(business_id);
CREATE INDEX IF NOT EXISTS idx_business_charges_status ON business_charges(status);

-- RLS
ALTER TABLE business_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_charges_select_own" ON business_charges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses WHERE businesses.id = business_charges.business_id AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "business_charges_admin" ON business_charges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "business_charges_service_role" ON business_charges
  FOR ALL USING (auth.role() = 'service_role');
