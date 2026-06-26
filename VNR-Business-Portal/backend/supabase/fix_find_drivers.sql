-- =============================================
-- FIX: Actualizar función para buscar conductores por tipo
-- =============================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS find_nearby_available_drivers(DECIMAL, DECIMAL, DECIMAL, INTEGER);

-- Crear función actualizada con filtro por driver_type
CREATE OR REPLACE FUNCTION find_nearby_available_drivers(
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_radius_km DECIMAL DEFAULT 5.0,
  p_limit INTEGER DEFAULT 10,
  p_driver_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  avatar TEXT,
  rating_average DECIMAL(3, 2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_km DECIMAL(10, 2),
  driver_type VARCHAR(50)
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
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(p_latitude)) * COS(RADIANS(dl.latitude)) *
        COS(RADIANS(dl.longitude) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(dl.latitude))
      ))
    ))::DECIMAL(10, 2) as distance_km,
    p.driver_type
  FROM public.profiles p
  INNER JOIN public.driver_locations dl ON dl.driver_id = p.id
  WHERE p.is_driver = true
    AND p.driver_status = 'active'
    AND p.availability_status = 'online'
    AND dl.timestamp > NOW() - INTERVAL '5 minutes' -- Solo ubicaciones recientes
    -- Filtrar por tipo de conductor si se especifica
    AND (p_driver_type IS NULL OR p.driver_type = p_driver_type)
    AND (6371 * ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(p_latitude)) * COS(RADIANS(dl.latitude)) *
        COS(RADIANS(dl.longitude) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(dl.latitude))
      ))
    )) <= p_radius_km
  ORDER BY p.id, dl.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Agregar columna availability_status si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'availability_status') THEN
    ALTER TABLE public.profiles ADD COLUMN availability_status VARCHAR(20) DEFAULT 'offline';
  END IF;
END $$;
