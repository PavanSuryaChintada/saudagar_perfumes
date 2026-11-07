import { expect, test } from '@playwright/test';
import { adminLogin } from './helpers';

// 360 px is the narrowest common Android width. No page may scroll sideways.
const noSideScroll = async (page: import('@playwright/test').Page) => {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, `page is ${scroll}px wide on a ${client}px screen`).toBeLessThanOrEqual(client + 1);
};

test.describe('360 px phones', () => {
  test.use({ viewport: { width: 360, height: 760 } });

  for (const path of ['/', '/shop', '/product/saudagar-deep-canopy', '/story', '/pages/shipping-policy', '/login', '/register']) {
    test(`storefront ${path} fits`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await noSideScroll(page);
    });
  }

  test('admin pages fit', async ({ page }) => {
    test.setTimeout(120_000);
    await adminLogin(page, '/admin');
    for (const path of ['/admin', '/admin/orders', '/admin/products', '/admin/pages', '/admin/coupons', '/admin/inventory']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await noSideScroll(page);
    }
  });
});
