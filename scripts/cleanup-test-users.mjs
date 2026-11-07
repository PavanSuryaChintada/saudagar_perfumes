// Deletes data created by e2e tests: orders of e2e+…@example.com customers (lines, events, returns, coupon uses
// and refunds cascade), the accounts themselves, products whose slug starts with "e2e-", and e2e CMS pages and
// announcements. Real data is never touched: everything is matched by the e2e markers.
import { runSql } from './lib/mgmt.mjs';

const orders = await runSql("delete from public.orders where customer_email like 'e2e+%@example.com' returning order_number");
const users = await runSql("delete from auth.users where email like 'e2e+%@example.com' returning email");
const products = await runSql("delete from public.products where slug like 'e2e-%' returning slug");
const pages = await runSql("delete from public.pages where slug like 'e2e-%' and not is_system returning slug");
const announcements = await runSql("delete from public.announcements where text like 'E2E %' returning id");
console.log(
  `removed ${orders.length} e2e order(s), ${users.length} user(s), ${products.length} product(s), ${pages.length} page(s), ${announcements.length} announcement(s)`,
);
