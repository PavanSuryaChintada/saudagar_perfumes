import { execSync } from 'node:child_process';

export default function globalTeardown() {
  execSync('node --env-file=.env.local scripts/cleanup-test-users.mjs', { stdio: 'inherit' });
}
