-- =============================================
-- River Service — Bootstrap para Supabase NUEVO
-- Ejecutar ESTE archivo primero si el proyecto está vacío.
-- Luego ejecutar river_service.sql (vessels) si no está incluido abajo.
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL DEFAULT '',
  apellido VARCHAR(100) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono_codigo_pais VARCHAR(10) DEFAULT '+54',
  telefono_numero VARCHAR(20) NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'driver', 'admin', 'business')),
  is_driver BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar TEXT DEFAULT '',
  cuit_cuil VARCHAR(20),
  tiene_comercio BOOLEAN DEFAULT FALSE,
  domicilio_comercio TEXT,
  link_type VARCHAR(20) DEFAULT 'independiente',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  insurance_company TEXT,
  policy_number TEXT,
  policy_expiry_date TEXT,
  policy_document_url TEXT,
  account_holder TEXT,
  account_type TEXT,
  cbu TEXT,
  bank_name TEXT,
  billing_preference TEXT,
  membership_skipped BOOLEAN DEFAULT FALSE,
  subscription_plan VARCHAR(20) DEFAULT 'bronce',
  subscription_billing_cycle VARCHAR(20) DEFAULT 'annual',
  subscription_expires_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auxilios náuticos (reutiliza tabla rides)
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('auxilio', 'vuelta-segura', 'chofer')),
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  status VARCHAR(30) DEFAULT 'pending',
  estimated_price DECIMAL(10, 2) DEFAULT 0,
  actual_price DECIMAL(10, 2),
  distance DECIMAL(10, 2),
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_user ON public.rides(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_service ON public.rides(service_type);

-- Embarcaciones de navegantes
CREATE TABLE IF NOT EXISTS public.vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration TEXT NOT NULL,
  type TEXT,
  length_m NUMERIC,
  beam_m NUMERIC,
  engines TEXT,
  base_location TEXT,
  color TEXT,
  draft_m NUMERIC,
  depth_m NUMERIC,
  geographic_area TEXT,
  link_type TEXT DEFAULT 'independiente',
  insurance_company TEXT,
  policy_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessels_user_id ON public.vessels(user_id);

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own rides" ON public.rides;
CREATE POLICY "Users can view own rides" ON public.rides FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own rides" ON public.rides;
CREATE POLICY "Users can create own rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own rides" ON public.rides;
CREATE POLICY "Users can update own rides" ON public.rides FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Drivers can view assigned rides" ON public.rides;
CREATE POLICY "Drivers can view assigned rides" ON public.rides FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS vessels_owner ON public.vessels;
CREATE POLICY vessels_owner ON public.vessels FOR ALL USING (auth.uid() = user_id);
