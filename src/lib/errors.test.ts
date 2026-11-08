import { describe, expect, it } from 'vitest';
import { GENERIC_ERROR, toFriendlyError } from './errors';

describe('toFriendlyError', () => {
  it('translates a failed login', () => {
    expect(toFriendlyError({ message: 'Invalid login credentials' })).toBe("That email and password don't match.");
    expect(toFriendlyError({ code: 'invalid_credentials', message: 'whatever' })).toBe("That email and password don't match.");
  });
  it('translates an existing account', () => {
    expect(toFriendlyError({ message: 'User already registered' })).toBe('An account with this email already exists. Try signing in instead.');
  });
  it('explains password rules', () => {
    expect(toFriendlyError({ code: 'weak_password', message: 'Password should contain at least one character of each: abc, 123' })).toBe(
      'Use at least 8 characters, with both letters and numbers.',
    );
    expect(toFriendlyError({ code: 'weak_password', message: 'Password is known to be weak and easy to guess' })).toBe(
      'That password has appeared in a data leak. Please choose a different one.',
    );
  });
  it('keeps the wait time from the auth cooldown', () => {
    expect(toFriendlyError({ message: 'For security purposes, you can only request this after 37 seconds.' })).toBe(
      'For security, please wait 37 seconds before trying again.',
    );
  });
  it('shows the text after a coded SQL exception', () => {
    expect(toFriendlyError({ message: 'DOB_LOCKED: Date of birth can only be set once' })).toBe('Date of birth can only be set once');
  });
  it('explains RLS refusals without jargon', () => {
    expect(toFriendlyError({ code: '42501', message: 'new row violates row-level security policy for table "x"' })).toMatch(/^You don't have permission/);
  });
  it('names the field that is already taken', () => {
    expect(
      toFriendlyError({ code: '23505', message: 'duplicate key value violates unique constraint "products_slug_key"', details: 'Key (slug)=(oud-roses) already exists.' }),
    ).toBe('That web address (slug) “oud-roses” is already used. Choose a different one.');
  });
  it('says what still uses a row that cannot be deleted', () => {
    expect(
      toFriendlyError({
        code: '23503',
        message: 'update or delete on table "categories" violates foreign key constraint "products_primary_category_id_fkey" on table "products"',
      }),
    ).toBe('This category is still used by products. Remove it from those first, or switch it off instead of deleting it.');
  });
  it('names a missing required field', () => {
    expect(toFriendlyError({ code: '23502', message: 'null value in column "full_name" of relation "addresses" violates not-null constraint' })).toBe(
      'Full name is required.',
    );
  });
  it('explains broken input types', () => {
    expect(toFriendlyError({ code: '22P02', message: 'invalid input syntax for type numeric: "abc"' })).toBe('Enter a number.');
    expect(toFriendlyError({ code: '22P02', message: 'invalid input syntax for type uuid: "x"' })).toMatch(/link looks broken/);
  });
  it('tells people to refresh after a deploy', () => {
    expect(toFriendlyError({ code: 'PGRST202', message: 'Could not find the function public.x in the schema cache' })).toBe(
      'The store was just updated. Refresh the page and try again.',
    );
  });
  it('explains storage limits', () => {
    expect(toFriendlyError({ message: 'The object exceeded the maximum allowed size' })).toMatch(/^That file is too big/);
    expect(toFriendlyError({ message: 'mime type image/heic is not supported' })).toMatch(/^That file type isn't supported/);
  });
  it('explains network failures', () => {
    expect(toFriendlyError(new TypeError('Failed to fetch'))).toBe("We couldn't reach the server. Check your connection and try again.");
  });
  it('never shows raw SQL', () => {
    const out = toFriendlyError({ message: 'operator does not exist: text = uuid' });
    expect(out).not.toMatch(/operator|uuid/);
    expect(out).toMatch(/Something went wrong on our side/);
  });
  it('passes plain sentences from our own functions through', () => {
    expect(toFriendlyError({ message: 'Only admins can refund.' })).toBe('Only admins can refund.');
  });
  it('uses the HTTP status when nothing else matches', () => {
    expect(toFriendlyError({ status: 429, message: '' })).toBe('Too many attempts. Please wait a minute and try again.');
  });
  it('falls back to a generic sentence for unknown values', () => {
    expect(toFriendlyError(undefined)).toBe(GENERIC_ERROR);
  });
});
