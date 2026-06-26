-- =============================================
-- VNR - Schema para WebSocket / Tiempo Real
-- =============================================

-- =============================================
-- TABLA: driver_locations
-- Almacena ubicaciones de conductores en tiempo real
-- =============================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,

  -- Coordenadas
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Datos adicionales de ubicación
  heading DECIMAL(5, 2) DEFAULT 0, -- Dirección en grados (0-360)
  speed DECIMAL(6, 2) DEFAULT 0, -- Velocidad en km/h
  accuracy DECIMAL(6, 2) DEFAULT 0, -- Precisión en metros
  altitude DECIMAL(8, 2), -- Altitud en metros

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON public.driver_locations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_ride ON public.driver_locations(ride_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON public.driver_locations(timestamp DESC);

-- =============================================
-- AGREGAR CAMPO DE DISPONIBILIDAD A PROFILES
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN availability_status VARCHAR(20) DEFAULT 'offline'
    CHECK (availability_status IN ('offline', 'online', 'busy', 'paused'));
  END IF;
END $$;

-- Índice para buscar conductores disponibles
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles(availability_status)
WHERE role = 'driver';

-- =============================================
-- FUNCIÓN: Limpiar ubicaciones antiguas
-- Elimina ubicaciones de más de 24 horas
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_driver_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.driver_locations
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Obtener última ubicación del conductor
-- =============================================
CREATE OR REPLACE FUNCTION get_driver_last_location(p_driver_id UUID)
RETURNS TABLE (
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  heading DECIMAL(5, 2),
  speed DECIMAL(6, 2),
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.latitude,
    dl.longitude,
    dl.heading,
    dl.speed,
    dl.timestamp
  FROM public.driver_locations dl
  WHERE dl.driver_id = p_driver_id
  ORDER BY dl.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Buscar conductores cercanos disponibles
-- =============================================
CREATE OR REPLACE FUNCTION find_nearby_available_drivers(
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_radius_km DECIMAL DEFAULT 5.0,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  driver_id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  avatar TEXT,
  rating_average DECIMAL(3, 2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_km DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id as driver_id,
    p.nombre,
    p.apellido,
    p.avatar,
    p.rating_average,
    dl.latitude,
    dl.longitude,
    -- Fórmula Haversine simplificada para distancia aproximada
    (6371 * ACOS(
      COS(RADIANS(p_latitude)) * COS(RADIANS(dl.latitude)) *
      COS(RADIANS(dl.longitude) - RADIANS(p_longitude)) +
      SIN(RADIANS(p_latitude)) * SIN(RADIANS(dl.latitude))
    ))::DECIMAL(10, 2) as distance_km
  FROM public.profiles p
  INNER JOIN public.driver_locations dl ON dl.driver_id = p.id
  WHERE p.role = 'driver'
    AND p.availability_status = 'online'
    AND dl.timestamp > NOW() - INTERVAL '5 minutes' -- Solo ubicaciones recientes
    AND (6371 * ACOS(
      COS(RADIANS(p_latitude)) * COS(RADIANS(dl.latitude)) *
      COS(RADIANS(dl.longitude) - RADIANS(p_longitude)) +
      SIN(RADIANS(p_latitude)) * SIN(RADIANS(dl.latitude))
    )) <= p_radius_km
  ORDER BY p.id, dl.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Conductores pueden insertar sus propias ubicaciones
CREATE POLICY "Drivers can insert own locations"
  ON public.driver_locations FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Usuarios pueden ver ubicaciones de conductores asignados a sus viajes
CREATE POLICY "Users can view driver locations for their rides"
  ON public.driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.user_id = auth.uid() OR r.driver_id = auth.uid())
    )
    OR driver_id = auth.uid() -- Conductores ven sus propias ubicaciones
  );

-- Admins pueden ver todas las ubicaciones
CREATE POLICY "Admins can view all locations"
  ON public.driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.driver_locations IS 'Ubicaciones en tiempo real de conductores';
COMMENT ON COLUMN public.driver_locations.heading IS 'Dirección en grados (0-360, 0=Norte)';
COMMENT ON COLUMN public.driver_locations.speed IS 'Velocidad en km/h';
COMMENT ON COLUMN public.driver_locations.accuracy IS 'Precisión del GPS en metros';
COMMENT ON COLUMN public.profiles.availability_status IS 'Estado de disponibilidad del conductor: offline, online, busy, paused';
