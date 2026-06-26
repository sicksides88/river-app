-- ============================================================
-- Migración: código de entrega (PIN) + distancia incluida
-- Aplicar en la DB Supabase EN VIVO (los .sql del repo están desactualizados).
-- ============================================================

-- 1) OBLIGATORIO — Código de entrega (PIN de 4 dígitos) en envíos.
--    El backend lo genera al crear el envío y lo valida al pasar a 'delivered'.
--    Sin esta columna, los inserts de envíos del backend nuevo fallarían.
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS delivery_code VARCHAR(4);

-- 2) OPCIONAL — Distancia incluida en la base, por tipo de servicio.
--    El backend ya usa un default en código (envíos: 1 km / ~10 cuadras) cuando
--    esta columna no existe. Agregarla solo si se quiere configurar desde el CRM.
ALTER TABLE service_rates
  ADD COLUMN IF NOT EXISTS included_km NUMERIC(10,2) NOT NULL DEFAULT 0;

UPDATE service_rates SET included_km = 1 WHERE service_type = 'envios';

-- 3) NOTA — Recargo nocturno.
--    Ya existe la regla en price_rules (rule_type='surcharge', 10%,
--    start_time 00:00 / end_time 06:30). El backend nuevo ya la aplica.
--    Para ajustar % o ventana (ej. 22:00–06:00 al 20%), editar desde el CRM:
--    UPDATE price_rules
--       SET percentage = 20,
--           conditions = '{"start_time":"22:00","end_time":"06:00"}'::jsonb
--     WHERE rule_type = 'surcharge' AND name = 'Recargo nocturno';
