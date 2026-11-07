import { expect, test } from '@playwright/test';
import { adminLogin, createTestProduct, registerCustomer } from './helpers';

test('a customer buys with cash on delivery, the admin packs and ships it, the customer sees tracking', async ({ page, browser }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const stamp = Date.now();
  const product = await createTestProduct(stamp);

  await registerCustomer(page);

  // Product page → bag
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(product.name.toUpperCase());
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  const bag = page.getByRole('button', { name: /Proceed to Checkout/ });
  await expect(bag).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Free samples', { exact: false }).first()).toBeVisible();
  await bag.click();

  // Checkout: add an address, cash on delivery, review, place
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole('button', { name: '+ Add a new address' }).click();
  await page.getByLabel('Recipient Name').fill('Ravi Kumar');
  await page.getByLabel('Mobile').fill('9876543210');
  await page.getByLabel('House / Flat, Street').fill('7 Beach Road');
  await page.getByLabel('City').fill('Visakhapatnam');
  await page.getByLabel('Pincode').fill('530001');
  await page.getByLabel('State').selectOption('Andhra Pradesh');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Ravi Kumar/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Cash on delivery available' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to payment →' }).click();
  await expect(page.getByRole('radio', { name: /Cash on delivery/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Review order →' }).click();
  await page.getByRole('button', { name: /^Place order · / }).click();

  // Confirmation
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\?placed=1$/, { timeout: 20_000 });
  await expect(page.getByText('Order placed')).toBeVisible();
  const orderNumber = (await page.locator('.font-mono').first().innerText()).trim();
  expect(orderNumber).toMatch(/^[A-Z]+-?\d+$/);

  // The admin packs and ships it
  const admin = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const ap = await admin.newPage();
  await adminLogin(ap, '/admin/orders');
  await ap.getByRole('link', { name: orderNumber }).click();
  await ap.getByRole('button', { name: 'Mark packed' }).click();
  await ap.getByRole('dialog').getByRole('button', { name: 'Mark packed' }).click();
  await expect(ap.getByText('Order packed.')).toBeVisible();
  await ap.getByRole('button', { name: 'Mark shipped' }).click();
  await ap.getByLabel('Tracking / article number').fill(`E2E${stamp}`);
  await ap.getByRole('dialog').getByRole('button', { name: 'Mark shipped' }).click();
  await expect(ap.getByText('Order shipped.')).toBeVisible();
  await admin.close();

  // The customer sees the tracking number and can no longer cancel
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Shipped' })).toBeVisible();
  await expect(page.getByText(`E2E${stamp}`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);

  await page.goto('/account');
  await expect(page.getByText(orderNumber)).toBeVisible();
});

test('a customer cancels a new order and the stock comes back', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const stamp = Date.now();
  const product = await createTestProduct(stamp, 3);
  await registerCustomer(page);

  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText('Only 3 left').first()).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: /Proceed to Checkout/ }).click({ timeout: 15_000 });
  await page.getByRole('button', { name: '+ Add a new address' }).click();
  await page.getByLabel('Recipient Name').fill('Meena Iyer');
  await page.getByLabel('Mobile').fill('9123456780');
  await page.getByLabel('House / Flat, Street').fill('2 Temple Street');
  await page.getByLabel('City').fill('Guntur');
  await page.getByLabel('Pincode').fill('522001');
  await page.getByLabel('State').selectOption('Andhra Pradesh');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to payment →' }).click();
  await page.getByRole('button', { name: 'Review order →' }).click();
  await page.getByRole('button', { name: /^Place order · / }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\?placed=1$/, { timeout: 20_000 });

  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText('Only 2 left').first()).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await page.getByRole('button', { name: 'Yes, cancel it' }).click();
  await expect(page.getByText(/This order was cancelled/)).toBeVisible();

  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText('Only 3 left').first()).toBeVisible();
});
