# River Service — Checklist E2E Fase 2 (Hito 47.0)

Flujo completo navegante → patrón → CRM operador.

## Pre-requisitos

- Backend `VNR-Business-Portal` en marcha con variables Supabase configuradas
- SQL aplicado: `river_service_shifts_patch.sql` (turnos/bases)
- Usuario navegante con embarcación registrada
- Usuario patrón (`is_driver`, `driver_status=active`) con app VNR-Chofer
- Usuario CRM con rol `admin` u `operator`

## 1. Navegante — SOS y auxilio

- [ ] Abrir VNR-Solicitante → SOS / auxilio náutico
- [ ] Completar tipo de emergencia y embarcación
- [ ] Ubicación: GPS o mapa manual (sin coords hardcodeadas si falla GPS)
- [ ] Confirmar solicitud → auxilio creado con `service_type=auxilio`

## 2. Cola — patrón en guardia

- [ ] VNR-Chofer: activar **EN GUARDIA** con `active_service_type=auxilio`
- [ ] Recibir notificación/modal de nuevo auxilio
- [ ] Ver datos de embarcación y navegante en modal / pantalla aceptar

## 3. Patrón — aceptar con ETA real

- [ ] Ingresar ETA (ej. 25 min) y aceptar
- [ ] Navegante en tracking ve **25 min** (no valor fijo 5)
- [ ] Estado navegante: asignado / patrón visible

## 4. Patrón — servicio activo completo

- [ ] Confirmar **arribo** → estado `arribado`
- [ ] Confirmar **zarpado** → estado `zarpado`
- [ ] Subir fotos **before**, **during**, **after** (error visible si falla upload)
- [ ] Capturar firma del cliente
- [ ] Confirmar **regreso / finalizar** → estado `finalizado`
- [ ] GPS activo durante servicio (ubicación emitida vía socket)

## 5. CRM — visibilidad operativa

- [ ] `/river` — dashboard muestra auxilio activo y KPIs
- [ ] `/river/mapa` — patrón en guardia en mapa
- [ ] `/river/auxilios/:id` — timeline (arribo, zarpado, regreso), fotos y firma

## 6. CRM — alta telefónica y asignación manual

- [ ] `/river/alta` — crear auxilio con `userId` + coordenadas
- [ ] Auxilio aparece en `/river/despacho` (cola pending)
- [ ] Asignar patrón manual → navegante/patrón reciben actualización

## 7. Turnos (opcional MVP)

- [ ] `/river/turnos` — crear base y turno de guardia
- [ ] `GET /api/patrols/my-shift` responde para patrón con turno activo

## Criterio de éxito (47.0)

Un auxilio creado por navegante (o alta telefónica CRM) se despacha a patrón en guardia, se ejecuta con ETA real y estados náuticos, y el operador lo ve en dashboard + detalle con evidencia (fotos/firma/timeline).
