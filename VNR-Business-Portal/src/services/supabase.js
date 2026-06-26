import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = SUPABASE_URL || 'https://zgkdqnmordbrsbpzdgem.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna2Rxbm1vcmRicnNicHpkZ2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzc0NjYsImV4cCI6MjA4MDU1MzQ2Nn0.VW8GZzCr5_pRrwcs0utG4BoYgtQybzqe8ste72VdELI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
