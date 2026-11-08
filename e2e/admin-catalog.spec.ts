import { expect, test } from '@playwright/test';
import { adminLogin } from './helpers';

test('admin creates a product with two sizes and a note, it goes live, archiving hides it', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1400, height: 950 });
  const stamp = Date.now();
  const name = `E2E Test Oud ${stamp}`;
  const slug = `e2e-test-oud-${stamp}`;

  await adminLogin(page, '/admin/products/new');
  // The editor starts with the category; the rest of the form opens once one is chosen.
  await expect(page.getByText('Choose a category above to continue.')).toBeVisible();
  // Categories are picked by searching, not from a long list.
  // Under a full parallel run the first click can land while the list is still settling: retry until it sticks.
  await expect(async () => {
    await page.getByRole('combobox', { name: 'Main category' }).click();
    await page.getByRole('combobox', { name: 'Main category' }).fill('Extrait de Parfum');
    await page.getByRole('option', { name: 'Extrait de Parfum' }).click();
    // The editor goes part by part: "Next" leads from the category to the name.
    await page.getByRole('button', { name: /^Next: Name and description/ }).click({ timeout: 3000 });
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
  await page.getByLabel('Name', { exact: true }).fill(name);
  await expect(page.getByLabel('Link (slug)')).toHaveValue(slug);
  await page.getByRole('button', { name: /^Next: Sizes and prices/ }).click();
  await page.getByLabel('Base price (₹, incl. GST)').fill('4200');

  for (const ml of ['50', '100']) {
    await page.getByRole('button', { name: 'Add bottle size' }).click();
    const n = (await page.getByLabel('Size in ml').count()) - 1;
    // Typing the size fills the label; the SKU is set by hand here to keep the test's products easy to find.
    await page.getByLabel('Size in ml').nth(n).fill(ml);
    await expect(page.getByLabel('Size label').nth(n)).toHaveValue(`${ml} ml`);
    await page.getByLabel('SKU').nth(n).fill(`E2E-${stamp}-${ml}`);
  }
  // Perfume stock is the liquid: 500 ml is ten 50 ml bottles or five 100 ml bottles.
  await page.getByRole('button', { name: /^Next: Stock/ }).click();
  await page.getByLabel('Liquid in stock').fill('500');

  // Parts can also be opened straight from the side menu.
  await page.getByRole('button', { name: /Notes\s*0 notes/ }).click();
  await page.getByLabel('Add top note').fill('Wild Bergamot');
  await page.getByRole('button', { name: 'Wild Bergamot', exact: true }).click();
  await page.getByRole('button', { name: /Visibility and notes/ }).click();
  await page.getByRole('switch', { name: 'Live on the store' }).click();
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page.getByText('Product saved. Changes are live.')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}/);
  await expect(page.getByText('500 ml left').first()).toBeVisible();
  await page.getByRole('button', { name: /Sizes and prices/ }).click();
  await expect(page.getByText(/Enough for\s*10/).first()).toBeVisible();

  await page.goto(`/product/${slug}`);
  await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('E2E TEST OUD');
  await expect(page.getByRole('link', { name: 'Wild Bergamot' })).toBeVisible();
  await expect(page.getByRole('button', { name: '100 ml', exact: true }).first()).toBeVisible();

  await page.goto('/admin/products');
  const row = page.locator('div', { has: page.getByRole('link', { name: new RegExp(name) }) }).last();
  await row.getByRole('button', { name: 'Archive' }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).last().click();
  await expect(page.getByText('Product archived.')).toBeVisible();

  await page.goto(`/product/${slug}`);
  await expect(page.getByRole('heading', { name: 'This page has evaporated' })).toBeVisible();
});

test('admin catalog pages load', async ({ page }) => {
  await adminLogin(page, '/admin/notes');
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  await expect(page.getByText(/\d+ notes/).first()).toBeVisible();
  await page.goto('/admin/scent-profile');
  await expect(page.getByRole('heading', { name: 'Fragrance families', exact: true })).toBeVisible();
  await page.goto('/admin/collections');
  await expect(page.getByText('/collections/royal', { exact: false }).first()).toBeVisible();
  await page.goto('/admin/categories');
  await expect(page.getByText('/categories/extrait-de-parfum')).toBeVisible();
});
