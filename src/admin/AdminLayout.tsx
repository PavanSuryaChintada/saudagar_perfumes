import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ADMIN_NAV } from './nav';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {ADMIN_NAV.map((group, gi) => (
        <div key={gi} className="mb-4">
          {group.heading && <p className="px-5 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[#999999]">{group.heading}</p>}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-5 py-2 text-[13px] border-l-2 transition-colors ${
                  isActive ? 'border-[#C4823F] text-[#111111] bg-[#F8F7F5] font-medium' : 'border-transparent text-[#555555] hover:text-[#111111] hover:bg-[#FAFAF8]'
                }`
              }
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const brand = (
    <Link to="/admin" className="block px-5 py-5 border-b border-[#EAEAEA]">
      <span className="block text-[14px] tracking-[0.3em] uppercase text-[#111111]">Saudagar</span>
      <span className="block text-[10px] uppercase tracking-[0.18em] text-[#C4823F] mt-0.5">Store admin</span>
    </Link>
  );

  const footer = (
    <div className="border-t border-[#EAEAEA] p-4 space-y-2">
      <p className="text-[11px] text-[#888888] truncate" title={user?.email ?? ''}>
        {user?.email}
      </p>
      <div className="flex gap-2">
        <a href="/" target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#D5D3CC] px-2 py-1.5 text-[11px] text-[#555555] hover:border-[#111111]">
          <ExternalLink size={13} /> View store
        </a>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center justify-center gap-1.5 border border-[#D5D3CC] px-2 py-1.5 text-[11px] text-[#555555] hover:border-[#111111]">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7F5] text-[#111111] font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col bg-white border-r border-[#EAEAEA]">
        {brand}
        <NavList />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-[#EAEAEA] px-4 h-14">
        <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="p-2 -ml-2">
          <Menu size={20} />
        </button>
        <span className="text-[13px] tracking-[0.3em] uppercase">Saudagar</span>
        <span className="w-8" />
      </header>
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[80vw] max-w-[300px] flex flex-col bg-white">
            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-4 p-1.5">
              <X size={18} />
            </button>
            {brand}
            <NavList onNavigate={() => setDrawerOpen(false)} />
            {footer}
          </aside>
        </div>
      )}

      <main className="lg:pl-[240px]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
