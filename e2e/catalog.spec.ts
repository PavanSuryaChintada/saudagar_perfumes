import { expect, test } from '@playwright/test';

test('home "Latest drop" is filled from the database', async ({ page }) => {
  await page.goto('/');
  // The home page is built from CMS sections; the "Latest drop" carousel reads the latest-drop collection.
  await expect(page.getByText('Featured Flacons').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Thunderstruck/i).first()).toBeAttached({ timeout: 20_000 });
});

test('product page shows the note pyramid, real sizes and no fake reviews', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/product/saudagar-deep-canopy');
  await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('DEEP CANOPY');
  await expect(page.getByText('No reviews yet').first()).toBeVisible();
  await expect(page.getByText('Top Notes')).toBeVisible();
  const noteLink = page.getByRole('link', { name: 'Crushed Pine Needles' });
  await expect(noteLink).toHaveAttribute('href', '/notes/crushed-pine-needles');
  await expect(page.getByRole('button', { name: '50 ml', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Details & Compliance' }).click();
  await expect(page.getByText('3303')).toBeVisible();
});

test('unknown product shows the 404', async ({ page }) => {
  await page.goto('/product/does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page has evaporated' })).toBeVisible();
});

test('old collection links still work', async ({ page }) => {
  await page.goto('/collections/oud-royale');
  await expect(page.getByText('THE ROYAL COLLECTION').first()).toBeVisible();
  await expect(page.getByText(/^5\s*perfumes$/i)).toBeVisible();
});

test('filters are saved in the URL and narrow the results', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/shop');
  await expect(page.getByText(/^16\s*perfumes$/i)).toBeVisible();
  await page.getByRole('button', { name: /Occasion & ritual/i }).first().click();
  await page.getByText('Royal Gala & Evening', { exact: true }).first().click();
  await expect(page).toHaveURL(/occasion=evening/);
  await expect(page.getByText(/^16\s*perfumes$/i)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /Royal Gala & Evening/ })).toBeVisible(); // active filter chip survives reload
});

test('search finds products by note', async ({ page }) => {
  await page.goto('/search?q=bergamot');
  await expect(page.getByRole('heading', { name: /Results for “bergamot”/ })).toBeVisible();
  await expect(page.getByText(/^[1-9]\d*\s*perfumes?$/i)).toBeVisible();
});

test('notes library links to note pages', async ({ page }) => {
  await page.goto('/notes');
  await page.getByRole('link', { name: 'Taif Rose Petals' }).click();
  await expect(page).toHaveURL(/\/notes\/taif-rose-petals$/);
  await expect(page.getByRole('heading', { name: 'Taif Rose Petals' })).toBeVisible();
});
