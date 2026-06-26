import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ANON = process.env.SUPABASE_ANON_KEY;
const BACKEND = process.env.BACKEND_URL || 'https://vnr-api.whapy.com/api';
const PASS = 'Test1234!e2e';
const stamp = Date.now();
const users = [];
async function mk(p, patch){ const email=`e2e+${p}-${stamp}@vnrtest.local`; const {data,error}=await admin.auth.admin.createUser({email,password:PASS,email_confirm:true}); if(error)throw error; users.push(data.user.id); await admin.from('profiles').update({nombre:p,apellido:'E2E',...patch}).eq('id',data.user.id); return {id:data.user.id,email}; }
async function tok(email){ const r=await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:ANON,'Content-Type':'application/json'},body:JSON.stringify({email,password:PASS})}); return (await r.json()).access_token; }
async function hit(path, t){ const r=await fetch(`${BACKEND}${path}`,{headers:{Authorization:`Bearer ${t}`}}); let body; try{body=await r.json();}catch{body=await r.text();} return {status:r.status, body}; }
try{
  const d = await mk('actv',{role:'user',is_driver:true,driver_status:'active',driver_type:'cadete',driver_verified_at:new Date().toISOString()});
  const t = await tok(d.email);
  console.log('token ok:', !!t);
  const st = await hit('/drivers/status', t);
  console.log('\n=== GET /drivers/status ===\nHTTP', st.status, '\n', JSON.stringify(st.body).slice(0,400));
  const at = await hit('/drivers/active-trip', t);
  console.log('\n=== GET /drivers/active-trip ===\nHTTP', at.status, '\n', JSON.stringify(at.body).slice(0,600));
}catch(e){ console.log('ERR', e.message); }
finally{
  for(const u of users){ await admin.from('driver_availability').delete().eq('driver_id',u); await admin.auth.admin.deleteUser(u).catch(()=>{}); }
  console.log('\ncleanup done');
}
