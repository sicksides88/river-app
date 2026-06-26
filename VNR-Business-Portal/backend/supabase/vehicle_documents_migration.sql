-- =============================================
-- MIGRACIÓN: Documentos de Vehículos
-- Agrega relación entre documentos y vehículos
-- =============================================

-- Agregar columna vehicle_id a driver_documents si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'driver_documents' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE driver_documents
    ADD COLUMN vehicle_id UUID REFERENCES driver_vehicles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice para búsqueda por vehicle_id
CREATE INDEX IF NOT EXISTS idx_driver_documents_vehicle_id
ON driver_documents(vehicle_id);

-- Comentario explicativo de los tipos de documentos de vehículo
-- vehicle_registration = Cédula del vehículo
-- vehicle_insurance = Seguro del vehículo

-- Vista para obtener vehículos con estado de documentos
CREATE OR REPLACE VIEW vehicle_documents_status AS
SELECT
  v.id AS vehicle_id,
  v.driver_id,
  v.brand,
  v.model,
  v.plate_number,
  v.is_verified,
  COUNT(CASE WHEN d.document_type = 'vehicle_registration' AND d.status = 'approved' THEN 1 END) > 0 AS registration_approved,
  COUNT(CASE WHEN d.document_type = 'vehicle_insurance' AND d.status = 'approved' THEN 1 END) > 0 AS insurance_approved,
  COUNT(CASE WHEN d.document_type = 'vehicle_registration' AND d.status = 'pending' THEN 1 END) > 0 AS registration_pending,
  COUNT(CASE WHEN d.document_type = 'vehicle_insurance' AND d.status = 'pending' THEN 1 END) > 0 AS insurance_pending,
  CASE
    WHEN COUNT(CASE WHEN d.document_type IN ('vehicle_registration', 'vehicle_insurance') AND d.status = 'approved' THEN 1 END) = 2
    THEN true
    ELSE false
  END AS all_documents_approved
FROM driver_vehicles v
LEFT JOIN driver_documents d ON d.vehicle_id = v.id
GROUP BY v.id, v.driver_id, v.brand, v.model, v.plate_number, v.is_verified;

-- Función para verificar automáticamente un vehículo cuando todos sus documentos están aprobados
CREATE OR REPLACE FUNCTION check_vehicle_verification()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_id UUID;
  v_all_approved BOOLEAN;
BEGIN
  -- Solo procesar si el documento es de vehículo y fue aprobado
  IF NEW.vehicle_id IS NOT NULL AND NEW.status = 'approved' THEN
    v_vehicle_id := NEW.vehicle_id;

    -- Verificar si ambos documentos están aprobados
    SELECT
      COUNT(CASE WHEN document_type = 'vehicle_registration' AND status = 'approved' THEN 1 END) > 0
      AND
      COUNT(CASE WHEN document_type = 'vehicle_insurance' AND status = 'approved' THEN 1 END) > 0
    INTO v_all_approved
    FROM driver_documents
    WHERE vehicle_id = v_vehicle_id;

    -- Si ambos están aprobados, marcar vehículo como verificado
    IF v_all_approved THEN
      UPDATE driver_vehicles
      SET is_verified = true, verified_at = NOW()
      WHERE id = v_vehicle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para verificación automática
DROP TRIGGER IF EXISTS trigger_check_vehicle_verification ON driver_documents;
CREATE TRIGGER trigger_check_vehicle_verification
  AFTER UPDATE OF status ON driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION check_vehicle_verification();
