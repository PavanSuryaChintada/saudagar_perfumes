import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { AuthButton, AuthField, AuthLayout, FormMessage } from './AuthLayout';

export default function ForgotPasswordPage() {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter the email you signed up with.');
      return;
    }
    setBusy(true);
    try {
      await sendReset(email);
      setSent(true);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account help"
      title="Reset your password"
      footer={
        <Link to="/login" className="text-tk-ink dark:text-white underline underline-offset-4 hover:text-tk-accent">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <FormMessage kind="success">If an account exists for {email.trim()}, a reset link is on its way. Check your inbox.</FormMessage>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {error && <FormMessage kind="error">{error}</FormMessage>}
          <AuthField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <AuthButton busy={busy}>Send reset link</AuthButton>
        </form>
      )}
    </AuthLayout>
  );
}
