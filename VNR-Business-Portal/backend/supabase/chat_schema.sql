-- =============================================
-- VNR - Schema para Chat en Tiempo Real
-- Mensajes entre usuario y conductor durante viajes
-- =============================================

-- =============================================
-- TABLA: chat_messages
-- Almacena mensajes de chat durante viajes
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Contenido del mensaje
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'quick_reply', 'image', 'audio')),
  content TEXT NOT NULL,

  -- Para mensajes de ubicación
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),

  -- Estado del mensaje
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_ride ON public.chat_messages(ride_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(receiver_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- TABLA: chat_presence
-- Estado de presencia de usuarios en chat
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_presence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  is_viewing BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, ride_id)
);

-- Índice para buscar presencia
CREATE INDEX IF NOT EXISTS idx_chat_presence_ride ON public.chat_presence(ride_id, is_viewing);

-- =============================================
-- TABLA: quick_replies
-- Respuestas rápidas predefinidas
-- =============================================
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text VARCHAR(100) NOT NULL,
  category VARCHAR(20) DEFAULT 'general' CHECK (category IN ('general', 'arrival', 'delay', 'location', 'emergency')),
  for_role VARCHAR(20) DEFAULT 'both' CHECK (for_role IN ('user', 'driver', 'both')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar respuestas rápidas predefinidas
INSERT INTO public.quick_replies (text, category, for_role, sort_order) VALUES
  ('Estoy saliendo', 'general', 'user', 1),
  ('Ya casi llego', 'arrival', 'driver', 2),
  ('Estoy afuera', 'arrival', 'both', 3),
  ('Dame 2 minutos', 'delay', 'both', 4),
  ('Hay mucho trafico', 'delay', 'driver', 5),
  ('Estoy en la esquina', 'location', 'both', 6),
  ('No te encuentro', 'location', 'both', 7),
  ('Te espero en la entrada', 'location', 'user', 8),
  ('Voy para alla', 'general', 'driver', 9),
  ('Gracias!', 'general', 'both', 10)
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCIÓN: Obtener mensajes de un viaje
-- =============================================
CREATE OR REPLACE FUNCTION get_chat_messages(
  p_ride_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  ride_id UUID,
  sender_id UUID,
  sender_name VARCHAR(100),
  sender_avatar TEXT,
  receiver_id UUID,
  message_type VARCHAR(20),
  content TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.ride_id,
    cm.sender_id,
    p.nombre as sender_name,
    p.avatar as sender_avatar,
    cm.receiver_id,
    cm.message_type,
    cm.content,
    cm.location_lat,
    cm.location_lng,
    cm.is_read,
    cm.created_at
  FROM public.chat_messages cm
  INNER JOIN public.profiles p ON p.id = cm.sender_id
  WHERE cm.ride_id = p_ride_id
  ORDER BY cm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Marcar mensajes como leídos
-- =============================================
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.chat_messages
  SET is_read = TRUE, read_at = NOW()
  WHERE ride_id = p_ride_id
    AND receiver_id = p_user_id
    AND is_read = FALSE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Contar mensajes no leídos
-- =============================================
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id UUID)
RETURNS TABLE (
  ride_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.ride_id,
    COUNT(*)::BIGINT as unread_count
  FROM public.chat_messages cm
  WHERE cm.receiver_id = p_user_id
    AND cm.is_read = FALSE
  GROUP BY cm.ride_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_messages
CREATE POLICY "Users can view messages in their rides"
  ON public.chat_messages FOR SELECT
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages in their rides"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.user_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages read status"
  ON public.chat_messages FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Políticas para chat_presence
CREATE POLICY "Users can manage own presence"
  ON public.chat_presence FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para quick_replies (solo lectura)
CREATE POLICY "Anyone can view quick replies"
  ON public.quick_replies FOR SELECT
  USING (is_active = TRUE);

-- =============================================
-- TRIGGER: Actualizar updated_at
-- =============================================
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.chat_messages IS 'Mensajes de chat entre usuario y conductor durante viajes';
COMMENT ON TABLE public.chat_presence IS 'Estado de presencia en chat para evitar notificaciones innecesarias';
COMMENT ON TABLE public.quick_replies IS 'Respuestas rápidas predefinidas para chat';
COMMENT ON COLUMN public.chat_messages.message_type IS 'Tipo: text, location, quick_reply, image, audio';
