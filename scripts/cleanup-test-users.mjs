// Deletes data created by e2e tests: e2e+…@example.com accounts (profiles, roles, addresses cascade)
// and products whose slug starts with "e2e-" (sizes, media, links and stock history cascade).
import { runSql } from './lib/mgmt.mjs';

const users = await runSql("delete from auth.users where email like 'e2e+%@example.com' returning email");
const products = await runSql("delete from public.products where slug like 'e2e-%' and units_sold = 0 returning slug");
console.log(`removed ${users.length} e2e test user(s), ${products.length} e2e product(s)`);
