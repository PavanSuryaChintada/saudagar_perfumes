import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';

export async function adminLogin(page: Page, next = '/admin') {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL((url) => url.pathname === next);
}


function env(): Record<string, string> {
  const text = fs.readFileSync('.env.local', 'utf8');
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/** Signs in as the test admin through the API (for test setup only). */
export async function adminApi() {
  const e = env();
  const client = createClient(e.VITE_SUPABASE_URL, e.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: 'test@gmail.com', password: 'test1234' });
  if (error) throw error;
  return client;
}

/** A live product with its own stock, so e2e orders never touch real stock. Removed by the global teardown. */
export async function createTestProduct(stamp: number, stock = 20) {
  const api = await adminApi();
  const slug = `e2e-shop-${stamp}`;
  const { error } = await api.rpc('save_product', {
    payload: {
      slug,
      name: `E2E Shop Attar ${stamp}`,
      base_price: 2400,
      is_active: true,
      counts_toward_samples: true,
      variants: [{ sku: `E2E-SHOP-${stamp}-50`, kind: 'retail', size_ml: 50, label: '50 ml', initial_stock: stock }],
    },
  });
  if (error) throw error;
  return { slug, name: `E2E Shop Attar ${stamp}` };
}

export async function registerCustomer(page: Page) {
  const email = `e2e+${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('secret1234');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  return email;
}
