import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const API = 'https://vnr-api.whapy.com/api';

// 1x1 png transparente
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

let failures = 0;
const ok = (c, m) => { console.log(`${c ? '✅' : '❌'} ${m}`); if (!c) failures++; };

async function token() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.chofer@vnr.app', password: 'Vnrtest1234' }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login chofer: ' + JSON.stringify(j));
  return j.access_token;
}

const tok = await token();
const auth = (b) => ({ Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...(b || {}) });

// 2) crear vehículo (con los campos nuevos: vehicleType + capacity)
const vr = await fetch(`${API}/drivers/vehicles`, {
  method: 'POST', headers: auth(),
  body: JSON.stringify({ vehicleType: 'camioneta', brand: 'TestMarca', model: 'Furgon', year: 2020, color: 'Blanco', plateNumber: 'AB123CD', capacity: 1500 }),
});
const vj = await vr.json();
ok(vr.ok && vj.vehicle?.id, `POST /drivers/vehicles (HTTP ${vr.status})`);
const vehicleId = vj.vehicle?.id;

// verificar en DB que guardó vehicle_type + capacity
const { data: vrow } = await admin.from('driver_vehicles').select('vehicle_type, capacity, is_verified').eq('id', vehicleId).single();
ok(vrow?.vehicle_type === 'camioneta', `vehicle_type guardado = ${vrow?.vehicle_type}`);
ok(Number(vrow?.capacity) === 1500, `capacity guardada = ${vrow?.capacity}`);
ok(vrow?.is_verified === false, `is_verified = ${vrow?.is_verified} (queda en revisión)`);

// 3) subir un documento del vehículo (cédula frente) → Storage + driver_documents
const ur = await fetch(`${API}/drivers/documents/upload`, {
  method: 'POST', headers: auth(),
  body: JSON.stringify({ documentType: 'vehicle_registration_front', fileData: PNG, fileName: 'cedula.png', vehicleId }),
});
const uj = await ur.json();
ok(ur.ok, `POST /drivers/documents/upload (HTTP ${ur.status}) ${ur.ok ? '' : JSON.stringify(uj)}`);

// verificar en DB que se creó el driver_documents atado al vehículo, pending, con file_url
const { data: drow } = await admin.from('driver_documents')
  .select('document_type, status, file_url, vehicle_id').eq('vehicle_id', vehicleId).eq('document_type', 'vehicle_registration_front').single();
ok(!!drow, 'driver_documents creado para el vehículo');
ok(drow?.status === 'pending', `status del documento = ${drow?.status}`);
ok(typeof drow?.file_url === 'string' && drow.file_url.includes('http'), `file_url firmada generada (${(drow?.file_url||'').slice(0,40)}...)`);

// cleanup
await admin.from('driver_documents').delete().eq('vehicle_id', vehicleId);
await admin.from('driver_vehicles').delete().eq('id', vehicleId);
console.log('\n🧹 limpiado.');
console.log(failures === 0 ? '\n🎉 BACKEND OK end-to-end' : `\n⚠️ ${failures} fallaron`);
process.exit(failures === 0 ? 0 : 1);
