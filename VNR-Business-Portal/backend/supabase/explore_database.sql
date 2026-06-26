-- =====================================================
-- SCRIPTS PARA EXPLORAR BASE DE DATOS SUPABASE
-- Ejecutar en: Dashboard > SQL Editor
-- =====================================================

-- 1. LISTAR TODAS LAS TABLAS DEL SCHEMA PUBLIC
-- ---------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- 2. VER ESTRUCTURA DETALLADA DE TODAS LAS TABLAS
-- (columnas, tipos de datos, nullable, valores por defecto)
-- ---------------------------------------------
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;


-- 3. VER FOREIGN KEYS (RELACIONES ENTRE TABLAS)
-- ---------------------------------------------
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';


-- 4. VER POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public';


-- 5. VER ÍNDICES EXISTENTES
-- ---------------------------------------------
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;


-- 6. CONTAR REGISTROS POR TABLA (OPCIONAL)
-- ---------------------------------------------
-- Nota: Ejecutar cada línea por separado o ajustar según las tablas existentes
-- SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
-- UNION ALL
-- SELECT 'rides', COUNT(*) FROM rides
-- UNION ALL
-- SELECT 'deliveries', COUNT(*) FROM deliveries
-- UNION ALL
-- SELECT 'saved_locations', COUNT(*) FROM saved_locations;
