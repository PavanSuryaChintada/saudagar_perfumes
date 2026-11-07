import { expect, test } from '@playwright/test';

test('home has no sideways scroll at 360px', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.waitForTimeout(4000); // curtain preloader
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(360);
  expect(errors).toEqual([]);
});

test('legacy ?id= links land on the product page', async ({ page }) => {
  await page.goto('/?id=saudagar-amber-bark');
  await expect(page).toHaveURL(/\/product\/saudagar-amber-bark$/);
});

test('unknown pages show the 404', async ({ page }) => {
  await page.goto('/this-does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page has evaporated' })).toBeVisible();
});

test('account requires sign-in', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('sign-up asks only for email and password', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.locator('form input')).toHaveCount(2);
});
