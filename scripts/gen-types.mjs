// Regenerates src/lib/database.types.ts from the live schema.
import { writeFileSync } from 'node:fs';
import { env, mgmt } from './lib/mgmt.mjs';

const data = await mgmt(`/projects/${env('SUPABASE_PROJECT_REF')}/types/typescript?included_schemas=public`);
writeFileSync('src/lib/database.types.ts', data.types);
console.log('wrote src/lib/database.types.ts');
