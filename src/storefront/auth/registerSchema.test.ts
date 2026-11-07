import { describe, expect, it } from 'vitest';
import { registerSchema } from './RegisterPage';

const valid = { email: 'asha@example.com', password: 'secret123' };
const issues = (input: object) => {
  const r = registerSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path[0]);
};

describe('registerSchema (email + password only; details are added later in the account)', () => {
  it('accepts email and password', () => expect(issues(valid)).toEqual([]));
  it('rejects a bad email', () => expect(issues({ ...valid, email: 'asha' })).toEqual(['email']));
  it('rejects a short password', () => expect(issues({ ...valid, password: 'short' })).toEqual(['password']));
  it('does not ask for name, phone or birthday', () => expect(Object.keys(registerSchema.shape).sort()).toEqual(['email', 'password']));
});
