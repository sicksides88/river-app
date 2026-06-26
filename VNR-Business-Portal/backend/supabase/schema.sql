-- =============================================
-- VNR - Esquema de Base de Datos para Supabase
-- Migración desde MongoDB
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono_codigo_pais VARCHAR(10) DEFAULT '+54',
  telefono_numero VARCHAR(20) NOT NULL,
  direccion TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'driver', 'admin', 'business')),
  is_verified BOOLEAN DEFAULT FALSE,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================
-- TABLA: rides (viajes - Vuelta Segura / Chofer)
-- =============================================
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('vuelta-segura', 'chofer')),

  -- Pickup
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),

  -- Dropoff
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),

  -- Programación
  scheduled_date DATE,
  scheduled_hour INTEGER,
  scheduled_minute INTEGER,

  -- Estado y precios
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'driver-assigned', 'in-progress', 'completed', 'cancelled')),
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  distance DECIMAL(10, 2), -- en kilómetros
  duration INTEGER, -- en minutos

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rides
CREATE INDEX IF NOT EXISTS idx_rides_user ON public.rides(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id, status);

-- =============================================
-- TABLA: deliveries (envíos y fletes)
-- =============================================
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('envio', 'flete')),
  delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('enviar', 'recibir')),

  -- Pickup
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  pickup_contact_name VARCHAR(100),
  pickup_contact_phone VARCHAR(30),

  -- Dropoff
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  dropoff_contact_name VARCHAR(100),
  dropoff_contact_phone VARCHAR(30),

  -- Programación
  scheduled_date DATE,
  scheduled_hour INTEGER,
  scheduled_minute INTEGER,

  -- Detalles del paquete
  package_description TEXT,
  package_weight DECIMAL(10, 2),
  package_length DECIMAL(10, 2),
  package_width DECIMAL(10, 2),
  package_height DECIMAL(10, 2),
  package_is_fragile BOOLEAN DEFAULT FALSE,

  -- Estado y precios
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked-up', 'in-transit', 'delivered', 'cancelled')),
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  distance DECIMAL(10, 2),

  tracking_number VARCHAR(50) UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON public.deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON public.deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON public.deliveries(driver_id, status);

-- =============================================
-- TABLA: saved_locations (direcciones guardadas)
-- =============================================
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

-- Índices para saved_locations
CREATE INDEX IF NOT EXISTS idx_locations_user_last ON public.saved_locations(user_id, last_used DESC);
CREATE INDEX IF NOT EXISTS idx_locations_user_count ON public.saved_locations(user_id, usage_count DESC);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar tracking number automáticamente
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number = 'DEL' || EXTRACT(EPOCH FROM NOW())::BIGINT || FLOOR(RANDOM() * 1000)::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_delivery_tracking
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_number();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, telefono_numero, direccion, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE(NEW.raw_user_meta_data->>'direccion', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil en registro
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para rides
CREATE POLICY "Users can view own rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view assigned rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = driver_id);

-- Políticas para deliveries
CREATE POLICY "Users can view own deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliveries"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view assigned deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = driver_id);

-- Políticas para saved_locations
CREATE POLICY "Users can view own locations"
  ON public.saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own locations"
  ON public.saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON public.saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON public.saved_locations FOR DELETE
  USING (auth.uid() = user_id);
