-- =====================================================
-- SCHEMA DE NOTIFICACIONES PUSH - VNR App
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- TABLA: push_tokens
-- Almacena los tokens de dispositivos para push notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(10) CHECK (platform IN ('android', 'ios', 'web')),
    device_id VARCHAR(100),
    device_name VARCHAR(100),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Indices para push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- TABLA: notifications
-- Historial de notificaciones enviadas a usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- TABLA: notification_preferences
-- Preferencias de notificaciones por usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    ride_updates BOOLEAN DEFAULT true,
    driver_nearby BOOLEAN DEFAULT true,
    promotions BOOLEAN DEFAULT true,
    payment_updates BOOLEAN DEFAULT true,
    chat_messages BOOLEAN DEFAULT true,
    rating_reminders BOOLEAN DEFAULT true,
    weekly_summary BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en push_tokens
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_push_tokens_updated_at();

-- Trigger para actualizar updated_at en notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Trigger para marcar read_at cuando is_read cambia a true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_read_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politicas para push_tokens
CREATE POLICY "Users can view own push tokens"
    ON push_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
    ON push_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
    ON push_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
    ON push_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- Politicas para notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Solo el backend puede insertar notificaciones (usando service_role key)
CREATE POLICY "Service can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Politicas para notification_preferences
CREATE POLICY "Users can view own preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Funcion para obtener tokens activos de un usuario
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id UUID)
RETURNS TABLE (token TEXT, platform VARCHAR(10)) AS $$
BEGIN
    RETURN QUERY
    SELECT pt.token, pt.platform
    FROM push_tokens pt
    WHERE pt.user_id = p_user_id
    AND pt.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para contar notificaciones no leidas
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_result
    FROM notifications
    WHERE user_id = p_user_id
    AND is_read = false;

    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para marcar todas las notificaciones como leidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id
    AND is_read = false;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para limpiar notificaciones antiguas (> 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para limpiar tokens inactivos (no usados en 60 dias)
CREATE OR REPLACE FUNCTION cleanup_inactive_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM push_tokens
    WHERE last_used_at < NOW() - INTERVAL '60 days'
    OR is_active = false;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TIPOS DE NOTIFICACION (REFERENCIA)
-- =====================================================
-- ride_requested      - Usuario solicito viaje (para conductores)
-- ride_accepted       - Conductor acepto viaje (para usuario)
-- driver_nearby       - Conductor esta cerca (para usuario)
-- driver_arrived      - Conductor llego al punto de recogida
-- ride_started        - Viaje iniciado
-- ride_completed      - Viaje completado
-- ride_cancelled      - Viaje cancelado
-- payment_received    - Pago recibido
-- payment_failed      - Pago fallido
-- wallet_deposit      - Deposito en wallet
-- wallet_withdrawal   - Retiro de wallet
-- earning_available   - Ganancia disponible (conductor)
-- new_message         - Nuevo mensaje de chat
-- rating_reminder     - Recordatorio para calificar
-- promo_offer         - Oferta promocional
-- system_alert        - Alerta del sistema
