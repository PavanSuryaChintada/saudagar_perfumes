import { describe, expect, it } from 'vitest';
import { registerSchema } from './RegisterPage';

const valid = { fullName: 'Asha Rao', email: 'asha@example.com', phone: '+91 98765 43210', dateOfBirth: '', password: 'secret123' };
const issues = (input: object) => {
  const r = registerSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path[0]);
};

describe('registerSchema', () => {
  it('accepts a complete sign-up without birthday', () => expect(issues(valid)).toEqual([]));
  it('accepts a past birthday', () => expect(issues({ ...valid, dateOfBirth: '1994-02-28' })).toEqual([]));
  it('rejects a future birthday', () => expect(issues({ ...valid, dateOfBirth: '2999-01-01' })).toEqual(['dateOfBirth']));
  it('rejects a non-Indian mobile', () => expect(issues({ ...valid, phone: '12345' })).toEqual(['phone']));
  it('rejects a short password', () => expect(issues({ ...valid, password: 'short' })).toEqual(['password']));
});
