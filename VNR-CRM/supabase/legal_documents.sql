-- =============================================
-- LEGAL DOCUMENTS TABLE
-- Para gestionar documentos legales del CRM
-- =============================================

-- Tabla principal de documentos legales
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'contract', 'policy', 'agreement', 'other')),
  is_required BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de versiones
CREATE TABLE IF NOT EXISTS legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_doc ON legal_document_versions(document_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER trigger_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;

-- Políticas para legal_documents
DROP POLICY IF EXISTS "Legal documents are viewable by authenticated users" ON legal_documents;
CREATE POLICY "Legal documents are viewable by authenticated users"
  ON legal_documents FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Legal documents are manageable by admins" ON legal_documents;
CREATE POLICY "Legal documents are manageable by admins"
  ON legal_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para legal_document_versions
DROP POLICY IF EXISTS "Legal document versions are viewable by authenticated users" ON legal_document_versions;
CREATE POLICY "Legal document versions are viewable by authenticated users"
  ON legal_document_versions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Legal document versions are manageable by admins" ON legal_document_versions;
CREATE POLICY "Legal document versions are manageable by admins"
  ON legal_document_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- DATOS INICIALES
-- =============================================

INSERT INTO legal_documents (title, slug, content, version, status, document_type, is_required) VALUES
  ('Términos y Condiciones', 'terminos-condiciones',
   '# Términos y Condiciones

## 1. Aceptación de los Términos
Al utilizar nuestros servicios, usted acepta estos términos y condiciones en su totalidad.

## 2. Descripción del Servicio
VNR proporciona servicios de transporte y logística a través de su plataforma.

## 3. Uso del Servicio
Los usuarios deben tener al menos 18 años para utilizar el servicio.

## 4. Pagos
Todos los pagos se procesan de forma segura a través de nuestra plataforma.

## 5. Cancelaciones
Las cancelaciones están sujetas a nuestra política de cancelación vigente.',
   '2.1', 'published', 'terms', true),

  ('Política de Privacidad', 'politica-privacidad',
   '# Política de Privacidad

## 1. Información que Recopilamos
Recopilamos información personal necesaria para proporcionar nuestros servicios.

## 2. Uso de la Información
Utilizamos su información para procesar servicios y mejorar la experiencia.

## 3. Compartir Información
No vendemos su información personal a terceros.

## 4. Seguridad
Implementamos medidas de seguridad para proteger su información.

## 5. Sus Derechos
Tiene derecho a acceder, rectificar y eliminar sus datos personales.',
   '1.5', 'published', 'privacy', true),

  ('Contrato de Conductor', 'contrato-conductor',
   '# Contrato de Conductor

## 1. Relación Contractual
Este contrato establece los términos entre VNR y el conductor asociado.

## 2. Requisitos del Conductor
- Licencia de conducir vigente
- Vehículo en buen estado
- Seguro al día
- Antecedentes verificados

## 3. Comisiones
El conductor recibirá el porcentaje acordado por cada servicio completado.

## 4. Responsabilidades
El conductor es responsable de cumplir con las leyes de tránsito.

## 5. Terminación
Cualquiera de las partes puede terminar este contrato con aviso previo.',
   '3.0', 'published', 'contract', true),

  ('Política de Cancelación', 'politica-cancelacion',
   '# Política de Cancelación

## 1. Cancelaciones por el Usuario
- Sin cargo: hasta 5 minutos después de solicitar el servicio
- Con cargo parcial: después de 5 minutos
- Cargo completo: si el conductor ya llegó al punto de recogida

## 2. Cancelaciones por el Conductor
Los conductores pueden cancelar sin penalización en casos justificados.

## 3. Reembolsos
Los reembolsos se procesan en un plazo de 5-10 días hábiles.',
   '1.2', 'published', 'policy', false),

  ('Acuerdo de Nivel de Servicio', 'acuerdo-nivel-servicio',
   '# Acuerdo de Nivel de Servicio (SLA)

## 1. Disponibilidad
Nos comprometemos a mantener una disponibilidad del 99.5% del servicio.

## 2. Tiempos de Respuesta
- Soporte urgente: 1 hora
- Soporte general: 24 horas

## 3. Compensaciones
En caso de incumplimiento, se aplicarán las compensaciones acordadas.',
   '1.0', 'draft', 'agreement', false),

  ('Política de Reembolsos', 'politica-reembolsos',
   '# Política de Reembolsos

## 1. Elegibilidad
Son elegibles para reembolso los servicios que no se completaron satisfactoriamente.

## 2. Proceso de Solicitud
Envíe su solicitud a través de la app dentro de las 48 horas.

## 3. Plazos
Los reembolsos se procesan en 5-10 días hábiles.

## 4. Métodos de Reembolso
El reembolso se realizará al mismo método de pago utilizado.',
   '1.3', 'published', 'policy', false)
ON CONFLICT (slug) DO NOTHING;
