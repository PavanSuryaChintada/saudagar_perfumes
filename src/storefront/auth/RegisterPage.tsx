import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../../lib/auth';
import { toFriendlyError } from '../../lib/errors';
import { safeNext } from '../../lib/nav';
import { normalizeIndianPhone } from '../../lib/phone';
import { AuthButton, AuthField, AuthLayout, FormMessage } from './AuthLayout';

const todayIso = () => new Date().toISOString().slice(0, 10);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .refine((v) => normalizeIndianPhone(v) !== null, 'Enter a 10-digit Indian mobile number.'),
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => !v || (v >= '1900-01-01' && v <= todayIso()), 'Enter a real date of birth.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

type Errors = Partial<Record<keyof z.infer<typeof registerSchema>, string>>;

export default function RegisterPage() {
  const { signUp, user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'), '/account');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', dateOfBirth: '', password: '' });
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
      await signUp({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: normalizeIndianPhone(parsed.data.phone)!,
        password: parsed.data.password,
        dateOfBirth: parsed.data.dateOfBirth || null,
      });
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
          <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#111111] dark:text-white underline underline-offset-4 hover:text-[#C4823F]">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <AuthField label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
        <AuthField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <AuthField
          label="Mobile number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          hint="For order updates on WhatsApp."
        />
        <AuthField
          label="Birthday (optional)"
          name="dateOfBirth"
          type="date"
          max={todayIso()}
          value={form.dateOfBirth}
          onChange={set('dateOfBirth')}
          error={errors.dateOfBirth}
          hint="We send a birthday gift. It can only be set once."
        />
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
