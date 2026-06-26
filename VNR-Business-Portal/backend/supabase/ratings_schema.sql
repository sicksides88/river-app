-- =============================================
-- VNR - Sistema de Calificaciones (Ratings)
-- =============================================

-- =============================================
-- TABLA: ratings
-- Almacena todas las calificaciones entre usuarios y conductores
-- =============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Referencias al viaje/entrega
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,

  -- Quién califica y quién recibe la calificación
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Tipo de calificación
  rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('user_to_driver', 'driver_to_user')),

  -- Calificación (1-5 estrellas)
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),

  -- Comentario opcional
  comment TEXT,

  -- Tags predefinidos seleccionados (ej: "Puntual", "Amable", "Limpio")
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT rating_must_have_reference CHECK (
    (ride_id IS NOT NULL AND delivery_id IS NULL) OR
    (ride_id IS NULL AND delivery_id IS NOT NULL)
  ),
  CONSTRAINT unique_rating_per_ride UNIQUE (ride_id, rater_id),
  CONSTRAINT unique_rating_per_delivery UNIQUE (delivery_id, rater_id)
);

-- Índices para ratings
CREATE INDEX IF NOT EXISTS idx_ratings_ride ON public.ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_delivery ON public.ratings(delivery_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON public.ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON public.ratings(rated_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_type ON public.ratings(rating_type);

-- =============================================
-- AGREGAR CAMPOS DE RATING A PROFILES
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Índice para ordenar por rating
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating_average DESC);

-- =============================================
-- TABLA: rating_tags
-- Tags predefinidos para calificaciones
-- =============================================
CREATE TABLE IF NOT EXISTS public.rating_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_es VARCHAR(50) NOT NULL, -- Nombre en español
  rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('user_to_driver', 'driver_to_user', 'both')),
  min_stars INTEGER DEFAULT 1, -- Mínimo de estrellas para mostrar este tag
  is_positive BOOLEAN DEFAULT TRUE, -- Tag positivo o negativo
  icon VARCHAR(50), -- Nombre del icono (Ionicons)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tags predefinidos para calificar conductores
INSERT INTO public.rating_tags (name, name_es, rating_type, min_stars, is_positive, icon, display_order) VALUES
  -- Tags positivos (4-5 estrellas)
  ('punctual', 'Puntual', 'user_to_driver', 4, true, 'time-outline', 1),
  ('friendly', 'Amable', 'user_to_driver', 4, true, 'happy-outline', 2),
  ('clean_car', 'Auto limpio', 'user_to_driver', 4, true, 'car-outline', 3),
  ('safe_driving', 'Manejo seguro', 'user_to_driver', 4, true, 'shield-checkmark-outline', 4),
  ('good_route', 'Buena ruta', 'user_to_driver', 4, true, 'navigate-outline', 5),
  ('professional', 'Profesional', 'user_to_driver', 4, true, 'briefcase-outline', 6),
  -- Tags negativos (1-3 estrellas)
  ('late', 'Llegó tarde', 'user_to_driver', 1, false, 'time-outline', 7),
  ('rude', 'Poco amable', 'user_to_driver', 1, false, 'sad-outline', 8),
  ('dirty_car', 'Auto sucio', 'user_to_driver', 1, false, 'car-outline', 9),
  ('unsafe_driving', 'Manejo inseguro', 'user_to_driver', 1, false, 'warning-outline', 10),
  ('wrong_route', 'Mala ruta', 'user_to_driver', 1, false, 'navigate-outline', 11)
ON CONFLICT DO NOTHING;

-- Insertar tags predefinidos para calificar usuarios
INSERT INTO public.rating_tags (name, name_es, rating_type, min_stars, is_positive, icon, display_order) VALUES
  -- Tags positivos (4-5 estrellas)
  ('ready_on_time', 'Listo a tiempo', 'driver_to_user', 4, true, 'time-outline', 1),
  ('respectful', 'Respetuoso', 'driver_to_user', 4, true, 'happy-outline', 2),
  ('clear_directions', 'Direcciones claras', 'driver_to_user', 4, true, 'location-outline', 3),
  ('good_tipper', 'Buena propina', 'driver_to_user', 4, true, 'cash-outline', 4),
  -- Tags negativos (1-3 estrellas)
  ('not_ready', 'No estaba listo', 'driver_to_user', 1, false, 'time-outline', 5),
  ('rude_behavior', 'Comportamiento grosero', 'driver_to_user', 1, false, 'sad-outline', 6),
  ('wrong_address', 'Dirección incorrecta', 'driver_to_user', 1, false, 'location-outline', 7),
  ('no_show', 'No apareció', 'driver_to_user', 1, false, 'close-circle-outline', 8)
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCIÓN: Actualizar promedio de rating del usuario
-- =============================================
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el promedio y conteo del usuario calificado
  UPDATE public.profiles
  SET
    rating_average = (
      SELECT COALESCE(AVG(stars), 5.00)
      FROM public.ratings
      WHERE rated_id = NEW.rated_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE rated_id = NEW.rated_id
    )
  WHERE id = NEW.rated_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar rating después de insertar
CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- =============================================
-- FUNCIÓN: Obtener estadísticas de rating
-- =============================================
CREATE OR REPLACE FUNCTION get_rating_stats(p_user_id UUID)
RETURNS TABLE (
  average_rating DECIMAL(3, 2),
  total_ratings INTEGER,
  five_star INTEGER,
  four_star INTEGER,
  three_star INTEGER,
  two_star INTEGER,
  one_star INTEGER,
  top_tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(r.stars), 5.00)::DECIMAL(3, 2) as average_rating,
    COUNT(*)::INTEGER as total_ratings,
    COUNT(*) FILTER (WHERE r.stars = 5)::INTEGER as five_star,
    COUNT(*) FILTER (WHERE r.stars = 4)::INTEGER as four_star,
    COUNT(*) FILTER (WHERE r.stars = 3)::INTEGER as three_star,
    COUNT(*) FILTER (WHERE r.stars = 2)::INTEGER as two_star,
    COUNT(*) FILTER (WHERE r.stars = 1)::INTEGER as one_star,
    (
      SELECT ARRAY_AGG(tag ORDER BY cnt DESC)
      FROM (
        SELECT UNNEST(r2.tags) as tag, COUNT(*) as cnt
        FROM public.ratings r2
        WHERE r2.rated_id = p_user_id
        GROUP BY UNNEST(r2.tags)
        LIMIT 5
      ) top_tags_subq
    ) as top_tags
  FROM public.ratings r
  WHERE r.rated_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Verificar si puede calificar
-- =============================================
CREATE OR REPLACE FUNCTION can_rate_ride(p_ride_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_ride RECORD;
  v_already_rated BOOLEAN;
BEGIN
  -- Obtener información del viaje
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;

  -- Verificar que el viaje existe y está completado
  IF v_ride IS NULL OR v_ride.status != 'completed' THEN
    RETURN FALSE;
  END IF;

  -- Verificar que el usuario es parte del viaje
  IF v_ride.user_id != p_user_id AND v_ride.driver_id != p_user_id THEN
    RETURN FALSE;
  END IF;

  -- Verificar que no haya calificado ya
  SELECT EXISTS(
    SELECT 1 FROM public.ratings
    WHERE ride_id = p_ride_id AND rater_id = p_user_id
  ) INTO v_already_rated;

  RETURN NOT v_already_rated;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para ratings
CREATE POLICY "Users can view ratings they gave"
  ON public.ratings FOR SELECT
  USING (auth.uid() = rater_id);

CREATE POLICY "Users can view ratings they received"
  ON public.ratings FOR SELECT
  USING (auth.uid() = rated_id);

CREATE POLICY "Users can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- Los usuarios no pueden modificar ni eliminar ratings una vez creados

-- Políticas para rating_tags (solo lectura pública)
CREATE POLICY "Anyone can view active rating tags"
  ON public.rating_tags FOR SELECT
  USING (is_active = true);

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.ratings IS 'Calificaciones entre usuarios y conductores después de viajes/entregas';
COMMENT ON TABLE public.rating_tags IS 'Tags predefinidos para seleccionar en las calificaciones';
COMMENT ON COLUMN public.ratings.tags IS 'Array de tags seleccionados (ej: ["punctual", "friendly"])';
COMMENT ON COLUMN public.profiles.rating_average IS 'Promedio de calificaciones recibidas (1-5)';
COMMENT ON COLUMN public.profiles.rating_count IS 'Número total de calificaciones recibidas';
