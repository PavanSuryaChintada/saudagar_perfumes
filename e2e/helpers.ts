import { expect, type Page } from '@playwright/test';

export async function adminLogin(page: Page, next = '/admin') {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email').fill('test@gmail.com');
  await page.getByLabel('Password').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL((url) => url.pathname === next);
}
