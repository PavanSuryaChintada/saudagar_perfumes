// Auth settings for this project. Email confirmation stays off until a custom SMTP provider is configured
// (Supabase's built-in mailer only delivers to the project's team addresses). See docs/SETUP.md.
import { env, mgmt } from './lib/mgmt.mjs';

const ref = env('SUPABASE_PROJECT_REF');
const siteUrl = process.env.SITE_URL || 'http://localhost:5174';
const allow = ['http://localhost:5174/**', 'http://127.0.0.1:5174/**', 'https://*.vercel.app/**'];
if (process.env.SITE_URL) allow.push(`${process.env.SITE_URL}/**`);

const updated = await mgmt(`/projects/${ref}/config/auth`, {
  method: 'PATCH',
  body: {
    site_url: siteUrl,
    uri_allow_list: allow.join(','),
    mailer_autoconfirm: true,
    password_min_length: 8,
    external_email_enabled: true,
  },
});
console.log({
  site_url: updated.site_url,
  uri_allow_list: updated.uri_allow_list,
  mailer_autoconfirm: updated.mailer_autoconfirm,
  password_min_length: updated.password_min_length,
});
