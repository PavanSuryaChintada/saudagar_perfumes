// Auth settings for this project. Run: SITE_URL=https://your-domain node --env-file=.env.local scripts/configure-auth.mjs
// Redirects (sign-up confirmation, password reset) only go to the exact site URL and localhost: never a wildcard
// such as https://*.vercel.app, which would let any Vercel site receive a reset link.
// Email confirmation stays off until a custom SMTP provider is configured (Supabase's built-in mailer only delivers
// to the project's team addresses). See docs/SUPABASE.md.
import { env, mgmt } from './lib/mgmt.mjs';

const ref = env('SUPABASE_PROJECT_REF');
const siteUrl = (process.env.SITE_URL || 'http://localhost:5174').replace(/\/+$/, '');
const allow = new Set(['http://localhost:5174/**', 'http://127.0.0.1:5174/**', `${siteUrl}/**`]);
for (const extra of (process.env.EXTRA_REDIRECTS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
  if (extra.includes('*.')) throw new Error(`Refusing wildcard host in EXTRA_REDIRECTS: ${extra}`);
  allow.add(extra);
}

const updated = await mgmt(`/projects/${ref}/config/auth`, {
  method: 'PATCH',
  body: {
    site_url: siteUrl,
    uri_allow_list: [...allow].join(','),
    mailer_autoconfirm: process.env.CONFIRM_EMAIL === 'on' ? false : true,
    password_min_length: 8,
    password_required_characters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
    mailer_secure_email_change_enabled: true,
    refresh_token_rotation_enabled: true,
    external_email_enabled: true,
    external_anonymous_users_enabled: false,
  },
});
console.log({
  site_url: updated.site_url,
  uri_allow_list: updated.uri_allow_list,
  mailer_autoconfirm: updated.mailer_autoconfirm,
  password_min_length: updated.password_min_length,
  password_required_characters: updated.password_required_characters,
});
