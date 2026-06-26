-- =============================================
-- FIX V2: Usar tabla driver_availability correctamente
-- =============================================

-- Eliminar función anterior (todas las variantes)
DROP FUNCTION IF EXISTS find_nearby_available_drivers(DECIMAL, DECIMAL, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS find_nearby_available_drivers(DECIMAL, DECIMAL, DECIMAL, INTEGER, VARCHAR);

-- Crear función actualizada usando driver_availability
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
  SELECT
    p.id as driver_id,
    p.nombre,
    p.apellido,
    p.avatar,
    p.rating_average,
    da.current_latitude as latitude,
    da.current_longitude as longitude,
    -- Fórmula Haversine para distancia
    (6371 * ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(p_latitude)) * COS(RADIANS(da.current_latitude)) *
        COS(RADIANS(da.current_longitude) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(da.current_latitude))
      ))
    ))::DECIMAL(10, 2) as distance_km,
    p.driver_type
  FROM public.profiles p
  INNER JOIN public.driver_availability da ON da.driver_id = p.id
  WHERE p.is_driver = true
    AND p.driver_status = 'active'
    AND da.is_available = true
    AND da.current_latitude IS NOT NULL
    AND da.current_longitude IS NOT NULL
    AND da.last_location_update > NOW() - INTERVAL '10 minutes' -- Ubicación reciente
    -- Filtrar por tipo de conductor si se especifica
    AND (p_driver_type IS NULL OR p.driver_type = p_driver_type)
    -- Filtrar por distancia
    AND (6371 * ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(p_latitude)) * COS(RADIANS(da.current_latitude)) *
        COS(RADIANS(da.current_longitude) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(da.current_latitude))
      ))
    )) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
