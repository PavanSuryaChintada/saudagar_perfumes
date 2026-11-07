import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import RequireAdmin from './RequireAdmin';

const authState = { user: null as null | { id: string }, isAdmin: false, loading: false, signOut: vi.fn() };
vi.mock('../lib/auth', () => ({ useAuth: () => authState }));

function LoginProbe() {
  const loc = useLocation();
  return <p>login page {loc.pathname + loc.search}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<LoginProbe />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <p>secret admin content</p>
            </RequireAdmin>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAdmin', () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAdmin = false;
    authState.loading = false;
  });

  it('sends a signed-out visitor to the admin login, remembering where they were going', () => {
    renderAt('/admin/settings');
    expect(screen.getByText('login page /admin/login?next=%2Fadmin%2Fsettings')).toBeInTheDocument();
  });

  it('tells a signed-in customer they have no access', () => {
    authState.user = { id: 'u1' };
    renderAt('/admin');
    expect(screen.getByText("You don't have access")).toBeInTheDocument();
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument();
  });

  it('shows the admin to an admin', () => {
    authState.user = { id: 'u1' };
    authState.isAdmin = true;
    renderAt('/admin');
    expect(screen.getByText('secret admin content')).toBeInTheDocument();
  });

  it('shows nothing sensitive while the session is loading', () => {
    authState.loading = true;
    renderAt('/admin');
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument();
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
  });
});
