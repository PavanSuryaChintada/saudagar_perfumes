// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password>
// Creates (or finds) the user and grants the admin role. The service key is fetched into memory only.
import { env, mgmt, runSql } from './lib/mgmt.mjs';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: create-admin.mjs <email> <password>');
  process.exit(1);
}
const ref = env('SUPABASE_PROJECT_REF');
const url = `https://${ref}.supabase.co`;
const sqlEmail = email.toLowerCase().replace(/'/g, "''");

const findId = async () => (await runSql(`select id from auth.users where lower(email) = '${sqlEmail}'`))[0]?.id;

let id = await findId();
if (!id) {
  const keys = await mgmt(`/projects/${ref}/api-keys?reveal=true`);
  const secret = keys.find((k) => k.type === 'secret' && k.api_key) || keys.find((k) => k.name === 'service_role');
  if (!secret) throw new Error('No secret/service_role key available for this project.');
  const headers = { apikey: secret.api_key, 'Content-Type': 'application/json' };
  if (!secret.api_key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${secret.api_key}`;
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: 'Store Admin' } }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Could not create user: ${body.msg || body.message || res.status}`);
  id = body.id;
}
await runSql(`insert into public.user_roles (user_id, role) values ('${id}', 'admin') on conflict do nothing`);
const [check] = await runSql(`select public.has_role('${id}', 'admin') as is_admin`);
if (!check.is_admin) throw new Error('Admin role was not granted.');
console.log(`admin ready: ${email} (${id})`);
