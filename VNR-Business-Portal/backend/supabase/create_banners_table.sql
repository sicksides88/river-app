-- =============================================
-- TABLA DE BANNERS/CAROUSEL PARA CRM
-- =============================================

-- Crear tabla de banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contenido del banner
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  button_text VARCHAR(100),

  -- Acción al hacer click
  action_type VARCHAR(50) DEFAULT 'none', -- 'none', 'screen', 'url'
  action_value TEXT, -- Nombre de pantalla o URL

  -- Configuración de visualización
  location VARCHAR(50) DEFAULT 'home', -- 'home', 'services', 'profile', etc.
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Fechas de vigencia (opcional)
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Analytics
  clicks_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_banners_location ON public.banners(location);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(order_index);

-- Función para incrementar clicks
CREATE OR REPLACE FUNCTION increment_banner_clicks(banner_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.banners
  SET clicks_count = clicks_count + 1
  WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_banners_updated_at ON public.banners;
CREATE TRIGGER trigger_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_updated_at();

-- Habilitar RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer banners activos
CREATE POLICY "Banners activos son públicos" ON public.banners
  FOR SELECT
  USING (is_active = true);

-- Política: Solo admins pueden modificar (requiere rol admin en profiles)
CREATE POLICY "Solo admins modifican banners" ON public.banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comentarios
COMMENT ON TABLE public.banners IS 'Banners/Carousel para mostrar promociones desde el CRM';
COMMENT ON COLUMN public.banners.location IS 'Ubicación donde mostrar el banner: home, services, profile, etc.';
COMMENT ON COLUMN public.banners.action_type IS 'Tipo de acción: none (solo visual), screen (navegar a pantalla), url (abrir enlace)';
COMMENT ON COLUMN public.banners.action_value IS 'Valor de la acción: nombre de pantalla React Navigation o URL externa';

-- =============================================
-- DATOS DE EJEMPLO (opcional)
-- =============================================

-- INSERT INTO public.banners (title, description, image_url, button_text, action_type, action_value, location, order_index)
-- VALUES
--   (
--     'Tu primer viaje con descuento',
--     '¡Empezá con el pie derecho! Disfrutá un 20% off en tu primer viaje.',
--     'https://example.com/promo1.jpg',
--     'Viajar ahora',
--     'screen',
--     'VueltaSegura',
--     'home',
--     1
--   ),
--   (
--     'Envíos a toda hora',
--     'Llegamos a cada rincón con garantía. Entregas rápidas y confiables.',
--     'https://example.com/promo2.jpg',
--     'Enviar paquete',
--     'screen',
--     'Envios',
--     'home',
--     2
--   );
