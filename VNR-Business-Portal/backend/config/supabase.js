import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const serviceKeyInvalid =
  !supabaseServiceKey ||
  supabaseServiceKey.includes('REEMPLAZAR') ||
  supabaseServiceKey.includes('your-service-role');

if (serviceKeyInvalid) {
  console.error(
    '\n❌ SUPABASE_SERVICE_ROLE_KEY no configurada en backend/.env\n' +
      '   Supabase Dashboard → Settings → API → service_role (secret)\n'
  );
}

// Cliente con service role para operaciones del backend (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Cliente con anon key para operaciones autenticadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
