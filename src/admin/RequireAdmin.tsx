import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../lib/auth';

/** UI guard for /admin. Row-level security is the real guard; this only decides what to render. */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-white" aria-busy="true" />;
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white text-tk-ink">
        <div className="max-w-[420px] text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-tk-accent mb-2">Store admin</p>
          <h1 className="text-[24px] font-normal mb-3">You don't have access</h1>
          <p className="text-[14px] text-[#525252] mb-8">
            This account isn't an admin. Sign in with an admin account, or go back to the store.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="px-6 py-3 bg-tk-ink hover:bg-tk-accent text-white text-[12px] font-semibold uppercase tracking-[0.18em]"
            >
              Sign out
            </button>
            <Link to="/" className="px-6 py-3 border border-tk-ink text-[12px] font-semibold uppercase tracking-[0.18em]">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
