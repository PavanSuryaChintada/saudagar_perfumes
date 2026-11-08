// Security audit of the live database: who can call what, who can write what, and Supabase's advisors.
// Run: node --env-file=.env.local scripts/audit-db.mjs
import { env, mgmt, runSql } from './lib/mgmt.mjs';

const ref = env('SUPABASE_PROJECT_REF');

const fns = await runSql(`
  select p.proname as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as auth,
         coalesce(array_to_string(p.proconfig, ','), '') as config
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
  order by 1`);
console.log('\n== public functions callable by anon/authenticated ==');
for (const f of fns) if (f.anon || f.auth) console.log(`${f.definer ? 'DEFINER' : 'invoker'} anon=${f.anon ? 'Y' : '-'} auth=${f.auth ? 'Y' : '-'} ${f.name}(${f.args}) ${f.config.includes('search_path') ? '' : '!! no search_path'}`);

const tabs = await runSql(`
  select c.relname as t, c.relrowsecurity as rls,
    has_table_privilege('anon', c.oid, 'insert') as a_ins, has_table_privilege('anon', c.oid, 'update') as a_upd, has_table_privilege('anon', c.oid, 'delete') as a_del,
    has_table_privilege('authenticated', c.oid, 'insert') as u_ins, has_table_privilege('authenticated', c.oid, 'update') as u_upd, has_table_privilege('authenticated', c.oid, 'delete') as u_del,
    (select string_agg(pol.polname || '[' || case pol.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' else 'all' end || ':' || array_to_string(array(select rolname from pg_roles where oid = any(pol.polroles)), '/') || ']', ' ') from pg_policy pol where pol.polrelid = c.oid) as policies
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p','v') order by 1`);
console.log('\n== public tables ==');
for (const t of tabs) console.log(`${t.rls ? 'RLS' : '!! NO RLS'} ${t.t} anon:${t.a_ins ? 'I' : ''}${t.a_upd ? 'U' : ''}${t.a_del ? 'D' : ''} auth:${t.u_ins ? 'I' : ''}${t.u_upd ? 'U' : ''}${t.u_del ? 'D' : ''}\n    ${t.policies ?? '(no policies)'}`);

for (const kind of ['security', 'performance']) {
  try {
    const r = await mgmt(`/projects/${ref}/advisors/${kind}`);
    const lints = r.lints ?? r;
    console.log(`\n== ${kind} advisor: ${lints.length} findings ==`);
    const by = {};
    for (const l of lints) (by[`${l.level} ${l.name}`] ??= []).push(l.detail ?? l.description);
    for (const [k, v] of Object.entries(by)) { console.log(`${k} (${v.length})`); for (const d of v.slice(0, 40)) console.log('   - ' + String(d).replace(/\s+/g, ' ').slice(0, 220)); }
  } catch (e) { console.log(`${kind} advisor unavailable: ${e.message}`); }
}

const auth = await mgmt(`/projects/${ref}/config/auth`);
const pick = ['site_url','uri_allow_list','mailer_autoconfirm','password_min_length','password_required_characters','password_hibp_enabled','security_update_password_require_reauthentication','mailer_secure_email_change_enabled','security_captcha_enabled','rate_limit_email_sent','rate_limit_token_refresh','rate_limit_verify','rate_limit_otp','rate_limit_anonymous_users','jwt_exp','sessions_timebox','sessions_inactivity_timeout','refresh_token_rotation_enabled','security_refresh_token_reuse_interval','external_anonymous_users_enabled','disable_signup','mfa_totp_enroll_enabled','mfa_totp_verify_enabled','smtp_host','mailer_otp_exp','db_max_pool_size'];
console.log('\n== auth config ==');
for (const k of pick) console.log(`${k}: ${JSON.stringify(auth[k])}`);
try {
  // Never print secrets: the Data API settings include the project's JWT secret.
  const { jwt_secret: _secret, ...pg } = await mgmt(`/projects/${ref}/postgrest`);
  console.log('\n== data api ==', JSON.stringify(pg));
} catch (e) {
  console.log(e.message);
}
