// Thin client for the Supabase Management API. Run scripts with: node --env-file=.env.local <script>
const API = 'https://api.supabase.com/v1';

export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local (see .env.example).`);
  return value;
}

export async function mgmt(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env('SUPABASE_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && data.message) || text || res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${message}`);
  }
  return data;
}

/** Run SQL against the project database. Returns the rows of the last statement. */
export async function runSql(query) {
  return mgmt(`/projects/${env('SUPABASE_PROJECT_REF')}/database/query`, { method: 'POST', body: { query } });
}

export function normalizeSql(text) {
  return text.replace(/\r\n/g, '\n');
}
