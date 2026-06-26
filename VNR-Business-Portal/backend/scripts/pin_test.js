// ==========================================================================
// TEST E2E — Código de entrega (PIN) + gateo de exposición
//   1) POST /deliveries genera un deliveryCode de 4 dígitos (al dueño)
//   2) El dueño ve el código vía GET /deliveries/:id; el cadete NO (pero ve
//      requiresDeliveryCode=true)
//   3) PUT /deliveries/:id/status delivered con código INCORRECTO → 400
//   4) ... con código CORRECTO → 200
// Crea datos marcados y limpia al final. Uso (dentro del contenedor):
//   docker exec -e BACKEND_URL=http://localhost:5001/api vnr-backend node scripts/pin_test.js
// ==========================================================================
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001/api';
const PASS = 'Test1234!e2e';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const stamp = Date.now();
const created = { users: [], deliveries: [] };
let failures = 0;

const log = (...a) => console.log(...a);
const ok = (cond, msg) => { log(`${cond ? '✅ PASS' : '❌ FAIL'} — ${msg}`); if (!cond) failures++; };

async function makeUser(prefix, profilePatch) {
  const email = `e2e+${prefix}-${stamp}@vnrtest.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASS, email_confirm: true });
  if (error) throw new Error(`createUser ${prefix}: ${error.message}`);
  const id = data.user.id;
  created.users.push(id);
  const { error: upErr } = await admin.from('profiles')
    .update({ nombre: prefix, apellido: 'E2E', ...profilePatch })
    .eq('id', id);
  if (upErr) throw new Error(`update profile ${prefix}: ${upErr.message}`);
  return { id, email };
}

async function token(email) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token ${email}: ${JSON.stringify(j)}`);
  return j.access_token;
}

const api = (path, tok, method = 'GET', body) =>
  fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

async function main() {
  log(`\n🌐 Backend: ${BACKEND_URL}`);
  const health = await (await fetch(`${BACKEND_URL}/health`)).json().catch(() => ({}));
  ok(health.status === 'ok', `backend health (${health.status || 'sin respuesta'})`);
  if (health.status !== 'ok') throw new Error('Backend no responde');

  const owner = await makeUser('pinowner', { role: 'user' });
  const driver = await makeUser('pindriver', { role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' });
  const ownerTok = await token(owner.email);
  const driverTok = await token(driver.email);

  // ---- 1) Crear envío → debe devolver deliveryCode de 4 dígitos ----
  log('\n=== TEST 1: POST /deliveries genera PIN de 4 dígitos ===');
  const createRes = await api('/deliveries', ownerTok, 'POST', {
    serviceType: 'envio',
    deliveryType: 'enviar',
    pickup: { address: 'Pickup PIN', coordinates: { lat: -34.60, lng: -58.40 }, contactName: 'A', contactPhone: '1' },
    dropoff: { address: 'Drop PIN', coordinates: { lat: -34.61, lng: -58.41 }, contactName: 'B', contactPhone: '2' },
    distance: 5,
    estimatedPrice: 4600,
    paymentMethod: 'cash',
  });
  const createJson = await createRes.json();
  ok(createRes.ok, `POST /deliveries (HTTP ${createRes.status})`);
  const deliveryId = createJson?.delivery?.id;
  const code = createJson?.delivery?.deliveryCode;
  if (deliveryId) created.deliveries.push(deliveryId);
  ok(/^\d{4}$/.test(String(code)), `delivery.deliveryCode es 4 dígitos (recibido: ${code})`);
  ok(createJson?.delivery?.estimatedPrice === 4600, `precio recalculado con distancia incluida = ${createJson?.delivery?.estimatedPrice} (esperado 4600)`);

  // Asignar cadete al envío (simula aceptación)
  await admin.from('deliveries').update({ driver_id: driver.id, status: 'confirmed' }).eq('id', deliveryId);

  // ---- 2) Gateo: dueño ve el código, cadete NO ----
  log('\n=== TEST 2: el dueño ve el PIN, el cadete no (requiresDeliveryCode=true) ===');
  const ownerResp = await api(`/deliveries/${deliveryId}`, ownerTok);
  const ownerView = await ownerResp.json();
  log(`   [debug owner GET ${ownerResp.status}] ${JSON.stringify(ownerView).slice(0, 300)}`);
  ok(ownerView?.delivery?.deliveryCode === code, `dueño ve deliveryCode (${ownerView?.delivery?.deliveryCode})`);

  const driverView = await (await api(`/deliveries/${deliveryId}`, driverTok)).json();
  ok(driverView?.delivery?.deliveryCode === undefined, 'cadete NO recibe deliveryCode (gateado)');
  ok(driverView?.delivery?.requiresDeliveryCode === true, 'cadete recibe requiresDeliveryCode=true');

  // ---- 3) Entregar con código INCORRECTO → 400 ----
  log('\n=== TEST 3: delivered con código incorrecto → 400 ===');
  const wrong = await api(`/deliveries/${deliveryId}/status`, driverTok, 'PUT', { status: 'delivered', code: '0000' });
  const wrongJson = await wrong.json().catch(() => ({}));
  ok(wrong.status === 400, `código incorrecto rechazado (HTTP ${wrong.status})`);
  ok(wrongJson?.code === 'INVALID_DELIVERY_CODE', `error code = ${wrongJson?.code}`);

  // El envío sigue sin entregar
  const stillConfirmed = await admin.from('deliveries').select('status').eq('id', deliveryId).single();
  ok(stillConfirmed.data?.status !== 'delivered', `el envío NO se cerró con código incorrecto (status='${stillConfirmed.data?.status}')`);

  // ---- 4) Entregar con código CORRECTO → 200 ----
  log('\n=== TEST 4: delivered con código correcto → 200 ===');
  const right = await api(`/deliveries/${deliveryId}/status`, driverTok, 'PUT', { status: 'delivered', code });
  ok(right.ok, `código correcto aceptado (HTTP ${right.status})`);
  const delivered = await admin.from('deliveries').select('status').eq('id', deliveryId).single();
  ok(delivered.data?.status === 'delivered', `el envío quedó 'delivered' (status='${delivered.data?.status}')`);
}

async function cleanup() {
  log('\n🧹 Limpiando...');
  for (const id of created.deliveries) {
    await admin.from('business_charges').delete().eq('delivery_id', id);
    await admin.from('driver_earnings').delete().eq('delivery_id', id);
    await admin.from('payments').delete().eq('delivery_id', id);
    await admin.from('deliveries').delete().eq('id', id);
  }
  for (const uid of created.users) {
    await admin.from('driver_earnings').delete().eq('driver_id', uid);
    await admin.from('driver_wallets').delete().eq('driver_id', uid);
    await admin.from('driver_availability').delete().eq('driver_id', uid);
    await admin.auth.admin.deleteUser(uid).catch(() => {});
  }
  log('🧹 Listo.');
}

main()
  .catch((e) => { log(`\n💥 ERROR: ${e.message}`); failures++; })
  .finally(async () => {
    await cleanup();
    log(`\n${failures === 0 ? '🎉 TODOS LOS TESTS PASARON' : `⚠️  ${failures} aserción(es) fallaron`}`);
    process.exit(failures === 0 ? 0 : 1);
  });
