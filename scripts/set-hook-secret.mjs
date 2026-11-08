// Creates (or rotates) the shared secret that lets database triggers call edge functions (automatic refunds,
// courier booking). Stored in Supabase Vault as shipping_hook_secret and as the SHIPPING_HOOK_SECRET function
// secret. Never printed. Run: node --env-file=.env.local scripts/set-hook-secret.mjs [--rotate]
import { randomBytes } from 'node:crypto';
import { env, mgmt, runSql } from './lib/mgmt.mjs';

const ref = env('SUPABASE_PROJECT_REF');
const rotate = process.argv.includes('--rotate');
const [{ has }] = await runSql(`select exists (select 1 from vault.secrets where name = 'shipping_hook_secret') as has`);
if (has && !rotate) {
  console.log('Hook secret already set. Pass --rotate to replace it.');
  process.exit(0);
}
const secret = randomBytes(32).toString('hex');
if (has) {
  await runSql(`select vault.update_secret((select id from vault.secrets where name = 'shipping_hook_secret'), '${secret}')`);
} else {
  await runSql(`select vault.create_secret('${secret}', 'shipping_hook_secret', 'Database to edge function hooks (refunds, courier booking)')`);
}
await mgmt(`/projects/${ref}/secrets`, { method: 'POST', body: [{ name: 'SHIPPING_HOOK_SECRET', value: secret }] });
console.log(has ? 'Hook secret rotated.' : 'Hook secret created.');
