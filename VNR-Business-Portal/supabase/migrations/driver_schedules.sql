-- Migración: Crear tabla driver_schedules para disponibilidad de choferes
-- Fecha: 2026-02-06

-- Crear tabla driver_schedules
CREATE TABLE IF NOT EXISTS driver_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    weekly_schedule JSONB DEFAULT '[
        {"day_of_week": 0, "is_available": false, "time_ranges": []},
        {"day_of_week": 1, "is_available": true, "time_ranges": [{"id": "default-1", "start_time": "09:00", "end_time": "18:00"}]},
        {"day_of_week": 2, "is_available": true, "time_ranges": [{"id": "default-2", "start_time": "09:00", "end_time": "18:00"}]},
        {"day_of_week": 3, "is_available": true, "time_ranges": [{"id": "default-3", "start_time": "09:00", "end_time": "18:00"}]},
        {"day_of_week": 4, "is_available": true, "time_ranges": [{"id": "default-4", "start_time": "09:00", "end_time": "18:00"}]},
        {"day_of_week": 5, "is_available": true, "time_ranges": [{"id": "default-5", "start_time": "09:00", "end_time": "18:00"}]},
        {"day_of_week": 6, "is_available": false, "time_ranges": []}
    ]'::jsonb,
    custom_dates JSONB DEFAULT '[]'::jsonb,
    booking_config JSONB DEFAULT '{
        "max_advance_days": 60,
        "min_notice_hours": 4,
        "buffer_days": 10,
        "buffer_type": "calendar"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por driver_id
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON driver_schedules(driver_id);

-- Comentarios de la tabla
COMMENT ON TABLE driver_schedules IS 'Almacena la disponibilidad horaria de conductores tipo chofer';
COMMENT ON COLUMN driver_schedules.weekly_schedule IS 'Horario semanal con disponibilidad por día (0=Domingo, 6=Sábado)';
COMMENT ON COLUMN driver_schedules.custom_dates IS 'Fechas específicas con horarios personalizados (excepciones)';
COMMENT ON COLUMN driver_schedules.booking_config IS 'Configuración de reservas (días de anticipación, antelación mínima, etc.)';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_driver_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_driver_schedules_updated_at ON driver_schedules;
CREATE TRIGGER trigger_driver_schedules_updated_at
    BEFORE UPDATE ON driver_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_schedules_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE driver_schedules ENABLE ROW LEVEL SECURITY;

-- Política: Los conductores pueden ver y editar solo su propio horario
CREATE POLICY "Conductores pueden ver su propio horario"
    ON driver_schedules FOR SELECT
    USING (auth.uid() = driver_id);

CREATE POLICY "Conductores pueden insertar su propio horario"
    ON driver_schedules FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Conductores pueden actualizar su propio horario"
    ON driver_schedules FOR UPDATE
    USING (auth.uid() = driver_id);

-- Política: Admins pueden ver y editar todos los horarios
CREATE POLICY "Admins pueden ver todos los horarios"
    ON driver_schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins pueden actualizar todos los horarios"
    ON driver_schedules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
