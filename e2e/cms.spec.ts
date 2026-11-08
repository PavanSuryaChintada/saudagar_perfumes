import { expect, test } from '@playwright/test';
import { adminApi, adminLogin } from './helpers';

test('admin creates and publishes a text page, and it shows on the site', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1400, height: 950 });
  const stamp = Date.now();
  const title = `E2E Gifting Guide ${stamp}`;
  const slug = `e2e-gifting-guide-${stamp}`;

  await adminLogin(page, '/admin/cms');
  await page.getByRole('button', { name: 'New page' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(title);
  await expect(dialog.getByLabel('Link')).toHaveValue(slug);
  await dialog.getByRole('button', { name: 'Create page' }).click();
  await expect(page).toHaveURL(new RegExp(`page=${slug}`));

  await page.locator('.ProseMirror').first().click();
  await page.keyboard.type('Wrap it in our signature box.');
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('button', { name: 'Save page' }).click();
  await expect(page.getByText('Page saved.')).toBeVisible();

  await page.goto(`/pages/${slug}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Wrap it in our signature box.')).toBeVisible();
});

test('admin adds an announcement and the bar appears on the store', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1400, height: 950 });
  const text = `E2E Free gift wrap this week ${Date.now()}`;
  await adminLogin(page, '/admin/cms');
  // Old addresses forward to the Website screen.
  await page.goto('/admin/content/announcements');
  await expect(page).toHaveURL(/tab=content&kind=announcements/);
  await page.getByRole('button', { name: 'Add announcement' }).click();
  await page.getByLabel('Message').fill(text);
  await page.getByRole('button', { name: 'Save announcement' }).click();
  await expect(page.getByText('Announcement saved.')).toBeVisible();

  await page.goto('/');
  await expect(page.getByText(text).first()).toBeAttached({ timeout: 20_000 });
});

test('admin home section edits reach the store', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1400, height: 950 });
  await adminLogin(page, '/admin/cms');
  await expect(page.getByLabel('Page', { exact: true })).toHaveValue('home');
  // Hide the second ribbon, check it is gone, then show it again. The real home page is always restored.
  try {
    await page.getByRole('button', { name: 'Hide Ribbon (reverse)' }).click();
    await expect(page.getByRole('button', { name: 'Show Ribbon (reverse)' })).toBeVisible();
    const store = await page.context().newPage();
    await store.goto('/');
    await expect(store.getByText('HAUTE PARFUMERIE EXTRAITS').first()).toBeAttached({ timeout: 20_000 });
    await expect(store.getByText('TIMELESS SIGNATURE')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show Ribbon (reverse)' }).click();
    await expect(page.getByRole('button', { name: 'Hide Ribbon (reverse)' })).toBeVisible();
    await store.reload();
    await expect(store.getByText('TIMELESS SIGNATURE').first()).toBeAttached({ timeout: 20_000 });
  } finally {
    const api = await adminApi();
    await api.from('website_sections').update({ is_visible: true }).eq('label', 'Ribbon (reverse)');
  }
});
