-- ==========================================================================
-- FIX DE SEGURIDAD RLS — VNR
-- Problema: driver_wallets, driver_earnings y payments tenían RLS DESACTIVADA.
-- Con la anon key (que es pública: viaja en la app y en los paneles web)
-- cualquiera podía leer saldos, ganancias y pagos de TODOS los usuarios.
--
-- La app/back acceden a estas tablas SOLO vía backend (service_role, que
-- ignora RLS), así que habilitar RLS no rompe nada. Se agregan además
-- políticas de "dueño" y "admin" por si algún panel las consulta con sesión.
-- ==========================================================================

-- ---------- driver_wallets ----------
ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_service_role" ON public.driver_wallets;
CREATE POLICY "wallets_service_role" ON public.driver_wallets
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "wallets_select_own" ON public.driver_wallets;
CREATE POLICY "wallets_select_own" ON public.driver_wallets
  FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "wallets_select_admin" ON public.driver_wallets;
CREATE POLICY "wallets_select_admin" ON public.driver_wallets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ---------- driver_earnings ----------
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "earnings_service_role" ON public.driver_earnings;
CREATE POLICY "earnings_service_role" ON public.driver_earnings
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "earnings_select_own" ON public.driver_earnings;
CREATE POLICY "earnings_select_own" ON public.driver_earnings
  FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "earnings_select_admin" ON public.driver_earnings;
CREATE POLICY "earnings_select_admin" ON public.driver_earnings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ---------- payments ----------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_service_role" ON public.payments;
CREATE POLICY "payments_service_role" ON public.payments
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ---------- audit_logs: quitar políticas permisivas (cualquier autenticado) ----------
-- Quedan solo las de admin (lectura/inserción), que ya existen.
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
