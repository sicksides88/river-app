-- ============================================
-- Fix para constraint de saved_payment_methods
-- ============================================
-- El constraint UNIQUE (user_id, is_default) era incorrecto
-- porque solo permitía UN método con is_default=FALSE por usuario.
--
-- Corregimos para que solo se limite UN default por usuario,
-- permitiendo múltiples métodos no-default.
-- ============================================

-- Eliminar el constraint incorrecto
ALTER TABLE saved_payment_methods
DROP CONSTRAINT IF EXISTS unique_default_per_user;

-- Crear un índice único parcial que solo aplica cuando is_default = TRUE
-- Esto asegura que solo haya UN método default por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_payment_per_user
ON saved_payment_methods (user_id)
WHERE is_default = TRUE AND status = 'active';

-- Verificar que el trigger de ensure_single_default sigue funcionando
-- (Ya existe en el schema original, pero lo recreamos por si acaso)
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment ON saved_payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment
  BEFORE INSERT OR UPDATE ON saved_payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_payment_method();
