-- =============================================
-- TABLA: saved_locations (direcciones guardadas)
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  formatted_address TEXT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location_type VARCHAR(20) DEFAULT 'both' CHECK (location_type IN ('pickup', 'dropoff', 'both')),
  label VARCHAR(20) DEFAULT 'other' CHECK (label IN ('home', 'work', 'other')),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar constraint UNIQUE para permitir upsert (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_locations_user_address_unique'
  ) THEN
    ALTER TABLE public.saved_locations
    ADD CONSTRAINT saved_locations_user_address_unique
    UNIQUE (user_id, address);
  END IF;
END $$;

-- Indices para mejor performance
CREATE INDEX IF NOT EXISTS idx_locations_user_last ON public.saved_locations(user_id, last_used DESC);
CREATE INDEX IF NOT EXISTS idx_locations_user_count ON public.saved_locations(user_id, usage_count DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_saved_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_locations_updated_at ON public.saved_locations;
CREATE TRIGGER update_saved_locations_updated_at
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION update_saved_locations_updated_at();

-- Habilitar RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Politicas RLS (usuarios solo ven sus propias ubicaciones)
DROP POLICY IF EXISTS "Users can view own locations" ON public.saved_locations;
CREATE POLICY "Users can view own locations"
  ON public.saved_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own locations" ON public.saved_locations;
CREATE POLICY "Users can insert own locations"
  ON public.saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own locations" ON public.saved_locations;
CREATE POLICY "Users can update own locations"
  ON public.saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own locations" ON public.saved_locations;
CREATE POLICY "Users can delete own locations"
  ON public.saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Permitir acceso al service role (para el backend)
DROP POLICY IF EXISTS "Service role has full access to locations" ON public.saved_locations;
CREATE POLICY "Service role has full access to locations"
  ON public.saved_locations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
