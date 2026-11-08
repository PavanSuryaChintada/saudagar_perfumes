// Deletes data created by e2e tests and the security probes: orders of e2e+…@example.com customers (lines, events,
// returns, coupon uses and refunds cascade), the accounts themselves, products whose slug starts with "e2e-", e2e CMS
// pages and announcements, coupons whose code starts with "E2E-", and newsletter or back-in-stock sign-ups from
// e2e+…@example.com addresses. Real data is never touched: everything is matched by the e2e markers.
import { runSql } from './lib/mgmt.mjs';

const orders = await runSql("delete from public.orders where customer_email like 'e2e+%@example.com' returning order_number");
const users = await runSql("delete from auth.users where email like 'e2e+%@example.com' returning email");
const products = await runSql("delete from public.products where slug like 'e2e-%' returning slug");
const pages = await runSql("delete from public.pages where slug like 'e2e-%' and not is_system returning slug");
const announcements = await runSql("delete from public.announcements where text like 'E2E %' returning id");
const coupons = await runSql("delete from public.coupons where code like 'E2E-%' returning code");
const signups = await runSql("delete from public.newsletter_signups where email like 'e2e+%@example.com' returning email");
const waits = await runSql("delete from public.back_in_stock_requests where email like 'e2e+%@example.com' returning email");
console.log(
  `removed ${orders.length} e2e order(s), ${users.length} user(s), ${products.length} product(s), ${pages.length} page(s), ${announcements.length} announcement(s), ${coupons.length} coupon(s), ${signups.length} newsletter and ${waits.length} back-in-stock sign-up(s)`,
);
