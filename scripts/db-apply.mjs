// Applies supabase/migrations/*.sql in name order through the Management API.
// Each applied file's sha256 is recorded; an applied migration that has since changed is refused.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runSql, normalizeSql } from './lib/mgmt.mjs';

const dir = 'supabase/migrations';

await runSql(`
  create schema if not exists app_private;
  create table if not exists app_private.applied_migrations (
    name text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  );
`);

const applied = new Map(
  (await runSql('select name, checksum from app_private.applied_migrations')).map((r) => [r.name, r.checksum]),
);

const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let count = 0;
for (const file of files) {
  const sql = normalizeSql(readFileSync(join(dir, file), 'utf8'));
  const checksum = createHash('sha256').update(sql).digest('hex');
  if (applied.has(file)) {
    if (applied.get(file) !== checksum) {
      console.error(`REFUSED: ${file} was edited after it was applied. Add a new migration instead.`);
      process.exit(1);
    }
    continue;
  }
  const escaped = file.replace(/'/g, "''");
  try {
    await runSql(`begin;\n${sql}\ninsert into app_private.applied_migrations (name, checksum) values ('${escaped}', '${checksum}');\ncommit;`);
  } catch (err) {
    console.error(`FAILED: ${file}\n  ${err.message}`);
    process.exit(1);
  }
  console.log(`applied ${file}`);
  count += 1;
}
console.log(count ? `\n${count} migration(s) applied` : 'nothing to apply');
