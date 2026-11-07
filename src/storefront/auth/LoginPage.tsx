import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { safeNext } from '../../lib/nav';
import { AuthButton, AuthField, AuthLayout, FormMessage } from './AuthLayout';

export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const { signIn, user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'), admin ? '/admin' : '/account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const nextQuery = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <AuthLayout
      eyebrow={admin ? 'Store admin' : 'Welcome back'}
      title={admin ? 'Sign in to the admin' : 'Sign in'}
      footer={
        admin ? null : (
          <>
            New to Saudagar?{' '}
            <Link to={`/register${nextQuery}`} className="text-[#111111] dark:text-white underline underline-offset-4 hover:text-[#C4823F]">
              Create an account
            </Link>
          </>
        )
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <AuthField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end -mt-2 mb-6">
          <Link to="/forgot-password" className="text-[11px] text-[#777777] dark:text-white/60 hover:text-[#C4823F] underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <AuthButton busy={busy}>Sign in</AuthButton>
      </form>
    </AuthLayout>
  );
}
