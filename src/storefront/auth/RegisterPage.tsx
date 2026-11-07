import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { safeNext } from '../../lib/nav';
import { AuthButton, AuthField, AuthLayout, FormMessage } from './AuthLayout';

// Sign-up asks only for email and password. Name, phone and birthday are added in Account → Personal details.
export const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

type Errors = Partial<Record<keyof z.infer<typeof registerSchema>, string>>;

export default function RegisterPage() {
  const { signUp, user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'), '/account');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as keyof Errors] ??= issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await signUp(parsed.data);
      navigate(next, { replace: true });
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Join the maison"
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-[#111111] dark:text-white underline underline-offset-4 hover:text-[#C4823F]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <AuthField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters."
        />
        <AuthButton busy={busy}>Create account</AuthButton>
      </form>
    </AuthLayout>
  );
}
