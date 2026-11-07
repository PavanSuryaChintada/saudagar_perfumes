import { describe, expect, it } from 'vitest';
import { toFriendlyError } from './errors';

describe('toFriendlyError', () => {
  it('translates a failed login', () => {
    expect(toFriendlyError({ message: 'Invalid login credentials' })).toBe("That email and password don't match.");
  });
  it('translates an existing account', () => {
    expect(toFriendlyError({ message: 'User already registered' })).toBe(
      'An account with this email already exists. Try signing in instead.',
    );
  });
  it('shows the text after a coded SQL exception', () => {
    expect(toFriendlyError({ message: 'DOB_LOCKED: Date of birth can only be set once' })).toBe(
      'Date of birth can only be set once',
    );
  });
  it('explains RLS refusals without jargon', () => {
    expect(toFriendlyError({ code: '42501', message: 'new row violates row-level security policy for table "x"' })).toBe(
      "You don't have permission to do that.",
    );
  });
  it('falls back to a generic sentence for unknown values', () => {
    expect(toFriendlyError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
