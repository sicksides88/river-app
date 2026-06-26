// ==========================================================================
// TEST END-TO-END de los flujos corregidos (VNR)
//   1) Facturación de envío de COMERCIO + pago al cadete (P0)
//   2) Activación de CADETE al aprobar el último documento desde el admin
//
// Crea datos de prueba marcados (e2e+timestamp@vnrtest.local), golpea el
// backend REAL por HTTP (debe estar corriendo con el código nuevo) y al final
// LIMPIA TODO. Uso:
//   BACKEND_URL=http://localhost:5055/api node scripts/e2e_test.js
// (requiere backend levantado: PORT=5055 node server.js)
// ==========================================================================
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { io } from 'socket.io-client';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5055/api';
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
  // El trigger handle_new_user ya creó el profile; lo actualizamos (UPDATE evita
  // violar NOT NULL de columnas que no pasamos).
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

async function main() {
  log(`\n🌐 Backend: ${BACKEND_URL}`);
  const health = await (await fetch(`${BACKEND_URL}/health`)).json().catch(() => ({}));
  ok(health.status === 'ok', `backend health (${health.status || 'sin respuesta'})`);
  if (health.status !== 'ok') throw new Error('Backend no responde. Levantalo: PORT=5055 node server.js');

  // ====================== TEST 1: facturación de comercio ======================
  log('\n=== TEST 1: envío de comercio entregado → business_charges + ganancia cadete ===');
  const driver = await makeUser('driver', { role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' });
  const bizUser = await makeUser('biz', { role: 'business', is_driver: false });
  const { data: biz, error: bizErr } = await admin.from('businesses')
    .insert({ user_id: bizUser.id, name: `Comercio E2E ${stamp}`, phone: '1100000000' })
    .select('id').single();
  if (bizErr) throw new Error(`businesses insert: ${bizErr.message}`);

  const PRICE = 1000;
  const { data: del, error: delErr } = await admin.from('deliveries').insert({
    user_id: bizUser.id, business_id: biz.id, driver_id: driver.id,
    service_type: 'envio', delivery_type: 'enviar', status: 'confirmed', estimated_price: PRICE,
    pickup_address: 'Origen E2E', pickup_lat: -34.6, pickup_lng: -58.4,
    dropoff_address: 'Destino E2E', dropoff_lat: -34.61, dropoff_lng: -58.41,
  }).select('id').single();
  if (delErr) throw new Error(`deliveries insert: ${delErr.message}`);
  created.deliveries.push(del.id);

  const driverTok = await token(driver.email);
  const r1 = await fetch(`${BACKEND_URL}/deliveries/${del.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverTok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'delivered' }),
  });
  ok(r1.ok, `PUT /deliveries/:id/status delivered (HTTP ${r1.status})`);

  const { data: charge } = await admin.from('business_charges').select('*').eq('delivery_id', del.id).maybeSingle();
  ok(!!charge, 'se creó business_charges para el envío de comercio');
  if (charge) {
    const fee = Number(charge.platform_fee), drv = Number(charge.driver_amount);
    ok(Number(charge.amount) === PRICE, `charge.amount = ${charge.amount} (esperado ${PRICE})`);
    ok(fee > 0 && fee < PRICE, `charge.platform_fee = ${fee} (comisión real de commission_settings)`);
    ok(fee + drv === PRICE, `platform_fee + driver_amount = ${fee + drv} == amount (${PRICE})`);
  }
  const { data: earning } = await admin.from('driver_earnings').select('*').eq('delivery_id', del.id).maybeSingle();
  ok(!!earning, 'se acreditó ganancia (driver_earnings) al cadete');

  // Idempotencia: re-entregar no duplica
  await fetch(`${BACKEND_URL}/deliveries/${del.id}/status`, {
    method: 'PUT', headers: { Authorization: `Bearer ${driverTok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'delivered' }),
  });
  const { count } = await admin.from('business_charges').select('id', { count: 'exact', head: true }).eq('delivery_id', del.id);
  ok(count === 1, `idempotencia: business_charges sigue en 1 (count=${count})`);

  // ====================== TEST 2: activación de cadete por aprobación de docs ======================
  log('\n=== TEST 2: aprobar último documento desde admin → cadete pasa a active ===');
  const driver2 = await makeUser('driver2', { role: 'user', is_driver: true, driver_status: 'pending_documents', driver_type: 'cadete' });
  const adminUser = await makeUser('admin', { role: 'admin', is_driver: false });

  const reqDocs = ['license_front', 'license_back', 'selfie_verification', 'buena_conducta'];
  for (const dt of reqDocs) {
    await admin.from('driver_documents').insert({ driver_id: driver2.id, document_type: dt, file_url: 'https://x/y.png', file_name: `${dt}.png`, status: 'approved' });
  }
  const { data: lastDoc } = await admin.from('driver_documents')
    .insert({ driver_id: driver2.id, document_type: 'seguro_accidentes', file_url: 'https://x/y.png', file_name: 'seg.png', status: 'pending' })
    .select('id').single();

  const adminTok = await token(adminUser.email);
  const r2 = await fetch(`${BACKEND_URL}/drivers/admin/documents/${lastDoc.id}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${adminTok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  ok(r2.ok, `PUT /drivers/admin/documents/:id approved (HTTP ${r2.status})`);

  const { data: prof } = await admin.from('profiles').select('driver_status, driver_verified_at').eq('id', driver2.id).single();
  ok(prof?.driver_status === 'active', `cadete activado automáticamente (driver_status='${prof?.driver_status}', esperado 'active')`);
  ok(!!prof?.driver_verified_at, 'driver_verified_at quedó seteado');

  // ====================== TEST 3: fallback de matching al conectarse ======================
  log('\n=== TEST 3: cadete se pone online → recibe envío pendiente cercano (re-broadcast) ===');
  const driver3 = await makeUser('driver3', { role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' });
  const { data: pend } = await admin.from('deliveries').insert({
    user_id: driver3.id, // da igual el dueño para este test
    service_type: 'envio', delivery_type: 'enviar', status: 'pending',
    estimated_price: 500, pickup_address: 'Pickup pend', pickup_lat: -34.60, pickup_lng: -58.40,
    dropoff_address: 'Drop pend', dropoff_lat: -34.61, dropoff_lng: -58.41,
  }).select('id').single();
  created.deliveries.push(pend.id);

  const driver3Tok = await token(driver3.email);
  const socketUrl = BACKEND_URL.replace(/\/api\/?$/, '');
  const socket = io(socketUrl, { auth: { token: driver3Tok }, transports: ['websocket'], reconnection: false });

  const received = await new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    socket.on('connect', async () => {
      socket.on('delivery:new_request', (payload) => {
        if (payload?.deliveryId === pend.id) finish(true);
      });
      // Ponerse online cerca del pickup → debe disparar el re-broadcast
      await fetch(`${BACKEND_URL}/drivers/availability`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driver3Tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: true, latitude: -34.60, longitude: -58.40, activeServiceType: 'cadete' }),
      }).catch(() => {});
    });
    socket.on('connect_error', () => finish(false));
    setTimeout(() => finish(false), 8000);
  });
  socket.disconnect();
  ok(received, 'el cadete recibió el envío pendiente por socket al conectarse (delivery:new_request)');

  // ====================== TEST 4: cadete cancela → envío se re-ofrece a otro ======================
  log('\n=== TEST 4: cadete A cancela su envío → vuelve a pending y cadete B lo recibe ===');
  const driverA = await makeUser('drvA', { role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' });
  const driverB = await makeUser('drvB', { role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' });

  const { data: asg } = await admin.from('deliveries').insert({
    user_id: driverA.id, service_type: 'envio', delivery_type: 'enviar', status: 'confirmed',
    driver_id: driverA.id, estimated_price: 700,
    pickup_address: 'Pickup A', pickup_lat: -34.60, pickup_lng: -58.40,
    dropoff_address: 'Drop A', dropoff_lat: -34.61, dropoff_lng: -58.41,
  }).select('id').single();
  created.deliveries.push(asg.id);

  const tokA = await token(driverA.email);
  const tokB = await token(driverB.email);
  const sockUrl = BACKEND_URL.replace(/\/api\/?$/, '');
  const sockB = io(sockUrl, { auth: { token: tokB }, transports: ['websocket'], reconnection: false });

  // Fase 1: conectar B y dejarlo listo (online cerca del pickup)
  await new Promise((resolve) => {
    sockB.on('connect', resolve);
    sockB.on('connect_error', resolve);
    setTimeout(resolve, 6000);
  });
  await fetch(`${BACKEND_URL}/drivers/availability`, {
    method: 'POST', headers: { Authorization: `Bearer ${tokB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable: true, latitude: -34.60, longitude: -58.40, activeServiceType: 'cadete' }),
  }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500)); // drenar re-ofertas previas del fallback

  // Fase 2: armar el listener SOLO para nuestro envío, luego A cancela
  const reofferP = new Promise((resolve) => {
    sockB.on('delivery:new_request', (p) => { if (p?.deliveryId === asg.id) resolve(true); });
    setTimeout(() => resolve(false), 7000);
  });
  const cancelRes = await fetch(`${BACKEND_URL}/deliveries/${asg.id}/cadete-cancel`, {
    method: 'PUT', headers: { Authorization: `Bearer ${tokA}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'test e2e' }),
  });
  ok(cancelRes.ok, `PUT /deliveries/:id/cadete-cancel (HTTP ${cancelRes.status})`);
  const reoffered = await reofferP;
  sockB.disconnect();

  const { data: after } = await admin.from('deliveries').select('status, driver_id').eq('id', asg.id).single();
  ok(after?.status === 'pending', `tras cancelar, el envío volvió a 'pending' (status='${after?.status}')`);
  ok(after?.driver_id === null, 'el envío quedó sin cadete asignado (driver_id null)');
  ok(reoffered, 'el envío se re-ofreció a otro cadete (B recibió delivery:new_request)');
}

async function cleanup() {
  log('\n🧹 Limpiando datos de prueba...');
  for (const id of created.deliveries) {
    await admin.from('business_charges').delete().eq('delivery_id', id);
    await admin.from('driver_earnings').delete().eq('delivery_id', id);
    await admin.from('payments').delete().eq('delivery_id', id);
    await admin.from('deliveries').delete().eq('id', id);
  }
  for (const uid of created.users) {
    await admin.from('driver_documents').delete().eq('driver_id', uid);
    await admin.from('driver_earnings').delete().eq('driver_id', uid);
    await admin.from('driver_wallets').delete().eq('driver_id', uid);
    await admin.from('driver_availability').delete().eq('driver_id', uid);
    await admin.from('trust_points_log').delete().eq('driver_id', uid);
    await admin.from('businesses').delete().eq('user_id', uid);
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
