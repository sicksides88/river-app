-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET 'driver-documents'
-- =====================================================
-- Ejecutar este SQL en el SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/[tu-proyecto]/sql

-- 1. Política para permitir a usuarios autenticados SUBIR archivos a su propia carpeta
CREATE POLICY "Conductores pueden subir sus propios documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Política para permitir a usuarios autenticados VER sus propios archivos
CREATE POLICY "Conductores pueden ver sus propios documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política para permitir a usuarios autenticados ACTUALIZAR sus propios archivos
CREATE POLICY "Conductores pueden actualizar sus propios documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política para permitir a usuarios autenticados ELIMINAR sus propios archivos
CREATE POLICY "Conductores pueden eliminar sus propios documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política para que el service_role (backend/CRM) pueda acceder a TODOS los documentos
-- (Esta política ya existe implícitamente con service_role, pero la dejamos explícita)
CREATE POLICY "Service role tiene acceso completo"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- =====================================================
-- NOTA: Si las políticas ya existen, elimínalas primero:
-- =====================================================
-- DROP POLICY IF EXISTS "Conductores pueden subir sus propios documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Conductores pueden ver sus propios documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Conductores pueden actualizar sus propios documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Conductores pueden eliminar sus propios documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role tiene acceso completo" ON storage.objects;
