import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { AuthButton, AuthField, AuthLayout, FormMessage } from './AuthLayout';

/** Reached from the reset email: Supabase signs the visitor in from the link, then they choose a new password. */
export default function ResetPasswordPage() {
  const { updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return setError('Use both letters and numbers.');
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      await updatePassword(password);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="Account help" title="Choose a new password">
      {!loading && !user ? (
        <FormMessage kind="error">
          This reset link has expired or was already used.{' '}
          <Link to="/forgot-password" className="underline underline-offset-4">
            Request a new one
          </Link>
          .
        </FormMessage>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <AuthField label="New password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <AuthField label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <AuthButton busy={busy || loading}>Save password</AuthButton>
        </form>
      )}
    </AuthLayout>
  );
}
