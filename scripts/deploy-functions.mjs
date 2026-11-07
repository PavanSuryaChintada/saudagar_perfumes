// Deploys the Supabase edge functions with the Supabase CLI (npx). Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.
// Usage: npm run functions:deploy            (all)
//        npm run functions:deploy -- razorpay-refund
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ref = process.env.SUPABASE_PROJECT_REF;
if (!ref || !process.env.SUPABASE_ACCESS_TOKEN) {
  console.error('Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN (see .env.local).');
  process.exit(1);
}
// Webhooks and the shipping hook are called by Razorpay, couriers or the database, not a signed-in user; they check their own secrets.
const NO_JWT = new Set(['razorpay-webhook', 'shipment-status-webhook', 'shipping']);
const dir = path.resolve('supabase/functions');
const all = fs.readdirSync(dir).filter((d) => !d.startsWith('_') && fs.existsSync(path.join(dir, d, 'index.ts')));
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : all;
for (const name of wanted) {
  const args = ['--yes', 'supabase@2', 'functions', 'deploy', name, '--project-ref', ref, '--use-api'];
  if (NO_JWT.has(name)) args.push('--no-verify-jwt');
  console.log(`deploying ${name}…`);
  execFileSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
}
console.log('done');
