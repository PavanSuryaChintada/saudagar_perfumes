import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { CircleHelp, ExternalLink, LogOut, Menu, X } from 'lucide-react';
import NotificationsBell from './NotificationsBell';
import AdminSearch, { SearchButton } from './AdminSearch';
import GuideDrawer from './guide/GuideDrawer';
import { GuideContext } from './guide/GuideContext';
import { useAuth } from '../lib/auth';
import { ADMIN_NAV } from './nav';

/** Several menu items open the same screen with different tabs; only the one matching the address lights up. */
function useActiveItem() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const all = ADMIN_NAV.flatMap((g) => g.items);
  const matches = (to: string, end?: boolean) => {
    const [path, query] = to.split('?');
    const pathOk = end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
    if (!pathOk) return false;
    if (!query) return true;
    return [...new URLSearchParams(query)].every(([k, v]) => params.get(k) === v);
  };
  return (to: string, end?: boolean) => {
    if (!matches(to, end)) return false;
    if (to.includes('?')) return true;
    // A plain item gives way to a more specific item for the same screen.
    return !all.some((i) => i.to !== to && i.to.startsWith(`${to}?`) && matches(i.to, i.end));
  };
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useActiveItem();
  return (
    <nav className="admin-nav flex-1 min-h-0 overflow-y-auto overscroll-contain py-3" aria-label="Admin">
      {ADMIN_NAV.map((group, gi) => (
        <div key={gi} className={gi === 0 ? 'mb-2' : 'mt-2 mb-2 pt-3 border-t border-white/10'}>
          {group.heading && (
            <p className="px-5 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-tk-accent-night">{group.heading}</p>
          )}
          {group.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive(item.to, item.end) ? 'page' : undefined}
              className={
                `flex items-center gap-2.5 mx-2 px-3 py-[7px] text-[13.5px] border-l-[3px] transition-colors ${
                  isActive(item.to, item.end) ? 'border-tk-accent-night bg-white/[0.10] text-white font-semibold' : 'border-transparent text-[#D6D3CC] hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              <item.icon size={16} strokeWidth={1.75} aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const guide = useMemo(() => ({ openHelp: () => setHelpOpen(true) }), []);

  useEffect(() => {
    setDrawerOpen(false);
    setHelpOpen(false);
  }, [location.pathname]);

  const brand = (
    <Link to="/admin" className="block px-5 py-5 border-b border-white/10">
      <span className="block text-[15px] tracking-[0.32em] uppercase text-white font-medium">Saudagar</span>
      <span className="block text-[11px] uppercase tracking-[0.2em] text-tk-accent-night mt-1">Store admin</span>
    </Link>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 space-y-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-8 h-8 shrink-0 flex items-center justify-center bg-tk-accent-night text-tk-night text-[13px] font-semibold uppercase" aria-hidden>
          {(user?.email ?? '?').charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block text-[12.5px] text-white truncate" title={user?.email ?? ''}>{user?.email}</span>
          <span className="block text-[11px] text-[#A9A6A0]">Admin</span>
        </span>
      </div>
      <div className="flex gap-2">
        <a href="/" target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 border border-white/20 px-2 py-1.5 text-[12px] text-[#E4E1DA] hover:border-white hover:text-white">
          <ExternalLink size={13} /> View store
        </a>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center justify-center gap-1.5 border border-white/20 px-2 py-1.5 text-[12px] text-[#E4E1DA] hover:border-white hover:text-white">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <GuideContext.Provider value={guide}>
    <div className="admin-root min-h-screen bg-[#F2F0EB] text-tk-ink font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col bg-[#17161B] text-white">
        {brand}
        <NavList />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-[#17161B] text-white px-4 h-14">
        <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="p-2 -ml-2">
          <Menu size={20} />
        </button>
        <span className="text-[14px] tracking-[0.3em] uppercase">Saudagar</span>
        <div className="flex items-center">
          <span className="admin-dark-icons flex items-center">
            <SearchButton compact onClick={() => setSearchOpen(true)} />
            <button type="button" aria-label="How this page works" onClick={() => setHelpOpen(true)} className="p-2 text-[#D6D3CC] hover:text-white">
              <CircleHelp size={18} />
            </button>
            <NotificationsBell />
          </span>
        </div>
      </header>
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[80vw] max-w-[300px] flex flex-col bg-[#17161B] text-white">
            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-4 p-1.5 text-white">
              <X size={18} />
            </button>
            {brand}
            <NavList onNavigate={() => setDrawerOpen(false)} />
            {footer}
          </aside>
        </div>
      )}

      <main className="lg:pl-[240px]">
        <div className="hidden lg:block sticky top-0 z-30 bg-white border-b border-[#E0DBD1]">
          <div className="flex items-center gap-3 mx-auto max-w-[1200px] px-8 h-16">
            <div className="flex-1">
              <SearchButton onClick={() => setSearchOpen(true)} />
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-1.5 border border-[#C4C1B9] bg-white px-3 py-2 text-[13.5px] text-[#3F3F3F] hover:border-tk-ink hover:text-tk-ink"
            >
              <CircleHelp size={15} aria-hidden /> Help
            </button>
            <NotificationsBell />
          </div>
        </div>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
      <GuideDrawer open={helpOpen} onOpenChange={setHelpOpen} />
      <AdminSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
    </GuideContext.Provider>
  );
}
