# VNR — Diagnóstico end-to-end, fixes aplicados y plan

> Generado en la sesión de configuración/auditoría. Fuente de verdad: **DB Supabase en vivo**
> (proyecto `VNR` ref `zgkdqnmordbrsbpzdgem`), no los `.sql` del repo (que están desactualizados).

## 1. Arquitectura

| Pieza | Carpeta | Stack | Rol |
|---|---|---|---|
| App móvil | `VNR-Business-Portal/` (raíz) | Expo 54 / RN 0.81 / React 19 | Usuarios **y** cadetes (dual-mode). Vuelta Segura, Envíos, Fletes, Chofer, Marketplace, Wallet |
| Backend | `VNR-Business-Portal/backend/` | Node/Express + Socket.io + Supabase + MercadoPago + Firebase FCM | API central, matching de cadetes, pagos/split, webhooks |
| Business Portal | `VNR-Business-Portal/business-portal/` | Vite/React/TS | Web para que las tiendas pidan cadetes (solo backend, JWT propio) |
| CRM/Admin | `VNR-CRM/` | Vite/React/TS | Panel admin (Supabase directo + backend para bypass RLS) |
| Whapy-VNR | `Whapy-VNR/` | Vite/React/TS | CRM legacy/duplicado (menos páginas). Recomendado: archivar |

- Backend NO usa MongoDB (`config/db.js` es código muerto). Todo Supabase (Auth + DB + Storage).
- Auth: Supabase Auth (JWT). El backend valida con `supabaseAdmin.auth.getUser(token)`.
- Webhooks: MercadoPago `POST /api/payments/webhook` (HMAC-SHA256), OAuth cadetes `GET /api/driver/mercadopago/callback`, redirects de pago → deep link `vnr://`.

## 2. Deploy (servidor ssh.whapy.com — Ubuntu, Docker)

| Servicio | Contenedor/puerto | Dominio | Estado |
|---|---|---|---|
| Backend | `vnr-backend` :5001 | `vnr-api.whapy.com` | ✅ healthy (Supabase ok) |
| Business Portal | `vnr-comercios` :3021 | `comercios-vnr.whapy.com` | ✅ HTTP 200 |
| CRM | `vnr-crm` :3022 | **(sin dominio)** | 🟠 corre pero NO expuesto |
| App móvil | — | EAS / stores | distribución por build, no server |

- Repos en `/opt/vnr-backend` (monorepo, branch `main`) y `/opt/vnr-crm` (branch `main`).
- Prod **NO tiene** configurado MercadoPago ni Firebase (faltan `MP_*`, `FCM_*`) → pagos online y push no funcionan en prod.

## 3. Datos reales (al momento de la auditoría)

51 profiles · 31 cadetes (17 active, 14 pending_documents) · 10 comercios · 4 admins ·
154 deliveries (101 delivered) · 81 rides · 160 driver_documents (todos approved) · business_charges **0**.

## 4. Bugs encontrados y estado

### ✅ Arreglados en esta sesión

1. **P0 — Envíos de comercio no facturaban ni pagaban al cadete.** La lógica de `business_charges` +
   acreditación vivía solo en el handler de socket `delivery:delivered`, pero la app marca entregado por
   REST (`updateDeliveryStatus`). Resultado: `business_charges` siempre vacío.
   **Fix:** `backend/controllers/delivery.controller.js` → helper `settleBusinessDelivery()` (idempotente)
   + branch para `business_id` en `updateDeliveryStatus`. Verificado por test e2e.

2. **Auto-activación de cadete rota.** `checkAndActivateDriver` (y `getDocuments`) exigían un documento
   `'insurance'` que ningún flujo sube (el seguro de vehículo es `vehicle_insurance`). Por eso ningún cadete
   se activaba automáticamente (los 17 active se activaron a mano).
   **Fix:** `backend/controllers/driver.controller.js` → `requiredDocs` con los 5 docs personales reales.

3. **CRM no activaba cadetes al aprobar documentos.** `drivers.service.ts` aprobaba documentos por Supabase
   directo, sin disparar `checkAndActivateDriver`, así que `driver_status` nunca pasaba a `active`.
   **Fix:** `VNR-CRM/src/services/drivers.service.ts` → `approveDocument`/`rejectDocument` ahora pegan al
   backend (`PUT /api/drivers/admin/documents/:id`), que sí dispara la activación. Se agregó `setDriverStatus()`
   para aprobar/suspender cadetes manualmente. Verificado por test e2e.

4. **Contadores de drivers mal en CRM.** `dashboard.service.ts` y `reportes.service.ts` filtraban por
   `driver_status` `'pending'`/`'approved'` (valores inexistentes; válidos: `pending_documents`,
   `pending_review`, `active`, `suspended`) y contaban drivers por `role='driver'` (solo 15 de 31).
   **Fix:** filtros corregidos + uso de `is_driver`. Tipo `Profile` actualizado con `is_driver`.

5. **🔒 Agujero de seguridad RLS.** `driver_wallets`, `driver_earnings`, `payments` tenían RLS **desactivada**
   → la anon key pública leía saldos/ganancias/pagos de todos.
   **Fix:** `backend/supabase/rls_security_fix.sql` (aplicado a prod). RLS habilitada + policies
   owner/admin/service_role. Re-test con anon → `[]`. Backend (service_role) sigue accediendo. También se
   quitaron policies permisivas de `audit_logs`.

### 🟠 Pendientes (recomendados, no aplicados)

- **Matching sin fallback (P1):** si al crear el pedido no hay cadetes online con `active_service_type='cadete'`,
  el envío queda `pending` para siempre (no se re-ofrece). La app del cadete depende 100% del push socket y NO
  consume `getAvailableDeliveries`. → Implementar re-broadcast al ponerse online un cadete y/o pantalla de
  "pedidos disponibles". (Explica los 3 envíos de comercio históricos colgados en `pending`.)
- **Doble implementación REST vs socket** del flujo de delivery (accept/estados). Unificar y validar
  `driver_type` también en el REST `acceptDelivery`.
- **Cancelación de cadete** deja el envío `cancelled` (no se re-ofrece). → re-poner en `pending` + re-matching.
- **Onboarding del cadete sin vehículo:** termina sin vehículo y `updateAvailability` exige vehículo
  verificado → no puede conectarse. Enlazar `AddVehicleScreen` al onboarding o relajar el requisito.
  Además `vehicle_documents_migration.sql` usa `vehicle_registration` viejo vs `vehicle_registration_front/back`
  del código → unificar nombres de `document_type`.
- **CRM sin dominio:** publicar `vnr-crm` (:3022) en nginx (ej. `crm-vnr.whapy.com`).
- **Prod sin MercadoPago/Firebase:** cargar `MP_*` y `FCM_*` en el `.env` del contenedor para habilitar pagos
  online y push.
- **Redeploy:** los fixes de backend/CRM están en local; falta `git pull` + rebuild de `vnr-backend` y
  `vnr-crm` en el servidor para que tomen efecto en prod.

## 5. Test end-to-end

`backend/scripts/e2e_test.js` — crea datos de prueba marcados, golpea el backend real por HTTP, valida:
1. Envío de comercio entregado → `business_charges` + `driver_earnings` (idempotente).
2. Aprobación del último documento desde admin → cadete pasa a `active`.

Y limpia todo al final. Correr:
```bash
cd VNR-Business-Portal/backend
PORT=5055 node server.js &           # backend con código nuevo
BACKEND_URL=http://localhost:5055/api node scripts/e2e_test.js
```
Resultado actual: **todos los tests pasan**. (La comisión real de `envio` es 18%, definida en `commission_settings`.)

## 6. Migraciones / archivos nuevos

- `backend/supabase/rls_security_fix.sql` — fix RLS (aplicado a prod).
- `backend/scripts/e2e_test.js` — test e2e.
- `.env` creados en backend, app móvil, business-portal, VNR-CRM, Whapy-VNR.

## 7. Notas de seguridad (acción recomendada del usuario)

- El git remote en el servidor tiene un token de GitHub embebido (`gho_…`) → rotarlo.
- Tokens de Supabase y password SSH fueron compartidos en texto plano → conviene rotarlos.
