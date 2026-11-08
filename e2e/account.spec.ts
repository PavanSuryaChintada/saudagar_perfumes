import { expect, test } from '@playwright/test';

test('a new customer registers, fills personal details and manages addresses', async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('secret1234');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('No orders yet', { exact: true })).toBeVisible();

  // Personal details: name, phone, birthday (locks once saved)
  await page.getByRole('button', { name: 'Personal Details' }).click();
  await page.getByLabel('Full Name').fill('Asha Rao');
  await page.getByLabel('Mobile').fill('+91 98765 43210');
  await page.getByLabel('Birthday').fill('1994-02-28');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Details saved.');
  await expect(page.getByText('28 February 1994')).toBeVisible();
  await expect(page.getByText('Your birthday is saved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Asha Rao' })).toBeVisible();

  // Addresses: first becomes default, second set as default leaves exactly one default
  await page.getByRole('button', { name: /Addresses/ }).click();
  for (const [line1, pin] of [['12 MG Road', '560001'], ['4 Brigade Road', '560025']]) {
    await page.getByRole('button', { name: '+ Add Address' }).click();
    await page.getByLabel('House / Flat, Street').fill(line1);
    await page.getByLabel('City').fill('Bengaluru');
    await page.getByLabel('Pincode').fill(pin);
    await page.getByLabel('State').selectOption('Karnataka');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(line1)).toBeVisible();
  }
  await expect(page.getByText('Default', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Make Default' }).click();
  await expect(page.getByRole('status')).toHaveText('Default address updated.');
  await expect(page.getByText('Default', { exact: true })).toHaveCount(1);

  // Bad pincode is caught before saving
  await page.getByRole('button', { name: '+ Add Address' }).click();
  await page.getByLabel('House / Flat, Street').fill('9 Test Lane');
  await page.getByLabel('City').fill('Pune');
  await page.getByLabel('Pincode').fill('01234');
  await page.getByLabel('State').selectOption('Maharashtra');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Enter a 6-digit pincode.')).toBeVisible();
});
