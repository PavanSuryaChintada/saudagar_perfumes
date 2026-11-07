// Runs every supabase/tests/*.sql inside BEGIN … ROLLBACK. A test fails by raising.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runSql, normalizeSql } from './lib/mgmt.mjs';

const dir = 'supabase/tests';
const only = process.argv[2];
const files = readdirSync(dir).filter((f) => f.endsWith('.sql') && (!only || f.includes(only))).sort();
let failed = 0;
for (const file of files) {
  const sql = normalizeSql(readFileSync(join(dir, file), 'utf8'));
  try {
    await runSql(`begin;\n${sql}\nrollback;`);
    console.log(`PASS ${file}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${file}\n  ${err.message}`);
  }
}
console.log(`\n${files.length - failed}/${files.length} SQL test files passed`);
process.exit(failed ? 1 : 0);
