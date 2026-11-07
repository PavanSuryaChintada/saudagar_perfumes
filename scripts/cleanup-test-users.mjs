// Deletes accounts created by e2e tests (e2e+…@example.com). Profiles, roles and addresses cascade.
import { runSql } from './lib/mgmt.mjs';

const rows = await runSql("delete from auth.users where email like 'e2e+%@example.com' returning email");
console.log(`removed ${rows.length} e2e test user(s)`);
