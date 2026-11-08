import { expect, test } from '@playwright/test';

// When the database can't be reached (outage, bad network), shoppers are told so and can try again; nothing pretends
// the shop is empty or the perfume no longer exists.
test('database unreachable: clear message with a way to try again, never a fake 404 or empty shop', async ({ page }) => {
  test.setTimeout(120_000);
  let blocked = true;
  await page.route(/supabase\.co/, (r) => (blocked ? r.abort('connectionfailed') : r.continue()));

  await page.goto('/product/saudagar-deep-canopy');
  await expect(page.getByRole('heading', { name: /can.t reach the shop/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/This page has evaporated/i)).toHaveCount(0);

  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: /can.t reach the shop/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Nothing here yet/i)).toHaveCount(0);

  // Back online: one tap brings the page back.
  blocked = false;
  await page.getByRole('button', { name: /try again/i }).click();
  await expect(page.getByRole('heading', { name: /can.t reach the shop/i })).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
