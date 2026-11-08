import { expect, test } from '@playwright/test';
import { registerCustomer } from './helpers';

test('signed-out visitors are sent to the admin login and come back after signing in', async ({ page }) => {
  await page.goto('/admin/settings');
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fsettings$/);
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/);
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  // Settings are split into parts: open the free samples part from the side menu.
  await page.getByRole('button', { name: /Free samples/ }).click();
  await expect(page.getByRole('heading', { name: 'Free samples' })).toBeVisible();
});

test('admin dashboard loads for the admin account', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('wrong password shows a friendly message', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText("That email and password don't match.");
});

test('admin search opens what you pick, and every page explains itself', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 950 });
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Ctrl+K → type → Enter opens the product.
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search the admin' }).fill('deep canopy');
  await expect(page.getByRole('option', { name: /Deep Canopy/i }).first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);

  // Admin pages are reachable from search too.
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search the admin' }).fill('refunds');
  await page.getByRole('option', { name: /Refunds/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/refunds$/);

  // "How this page works" opens this page's steps.
  await page.getByRole('button', { name: 'How this page works' }).first().click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Returns and refunds' })).toBeVisible();
  await page.getByRole('link', { name: 'Open the full guide' }).click();
  await expect(page.getByRole('heading', { name: 'Guide' })).toBeVisible();
  await expect(page.getByText(/of \d+ set up/)).toBeVisible();
});

test('only admins get the Admin panel button and the admin pages', async ({ page }) => {
  // A regular customer: no button on the account page, and /admin refuses them.
  await registerCustomer(page);
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Admin panel' })).toHaveCount(0);
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: "You don't have access" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Orders' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();

  // The admin: the button is there and opens the dashboard.
  await page.goto('/login?next=/account');
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByRole('button', { name: 'Admin panel' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
