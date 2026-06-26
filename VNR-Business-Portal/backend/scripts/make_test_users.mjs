import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PASSWORD = 'Vnrtest1234';
const accounts = [
  {
    email: 'test.usuario@vnr.app',
    profile: { nombre: 'Usuario', apellido: 'Prueba', role: 'user', is_driver: false },
  },
  {
    email: 'test.chofer@vnr.app',
    profile: { nombre: 'Chofer', apellido: 'Prueba', role: 'user', is_driver: true, driver_status: 'active', driver_type: 'cadete' },
  },
];

async function findByEmail(email) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users?.find((u) => u.email === email) || null;
}

for (const acc of accounts) {
  let user = null;
  const { data, error } = await admin.auth.admin.createUser({
    email: acc.email, password: PASSWORD, email_confirm: true,
  });
  if (error) {
    // ya existe → resetear password + confirmar
    user = await findByEmail(acc.email);
    if (user) {
      await admin.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
    } else {
      console.log(`ERROR con ${acc.email}: ${error.message}`);
      continue;
    }
  } else {
    user = data.user;
  }
  // setear/actualizar profile (el trigger handle_new_user ya creó la fila)
  const { error: upErr } = await admin.from('profiles').update(acc.profile).eq('id', user.id);
  console.log(`${acc.email}  →  id=${user.id}  profile=${upErr ? 'ERR ' + upErr.message : 'ok'}`);
}

console.log(`\nPassword para ambas: ${PASSWORD}`);
process.exit(0);
