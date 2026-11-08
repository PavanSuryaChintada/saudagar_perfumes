import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { CircleHelp, ExternalLink, LogOut, Menu, X } from 'lucide-react';
import NotificationsBell from './NotificationsBell';
import AdminSearch, { SearchButton } from './AdminSearch';
import GuideDrawer from './guide/GuideDrawer';
import { GuideContext } from './guide/GuideContext';
import { useAuth } from '../lib/auth';
import { ADMIN_NAV } from './nav';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4" aria-label="Admin">
      {ADMIN_NAV.map((group, gi) => (
        <div key={gi} className="mb-4">
          {group.heading && <p className="px-5 mb-1.5 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#4A4A4A]">{group.heading}</p>}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-5 py-2 text-[14px] border-l-2 transition-colors ${
                  isActive ? 'border-tk-accent text-tk-ink bg-[#F1EFEA] font-semibold' : 'border-transparent text-[#3F3F3F] hover:text-tk-ink hover:bg-[#F6F5F1]'
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const guide = useMemo(() => ({ openHelp: () => setHelpOpen(true) }), []);

  useEffect(() => {
    setDrawerOpen(false);
    setHelpOpen(false);
  }, [location.pathname]);

  const brand = (
    <Link to="/admin" className="block px-5 py-5 border-b border-[#E2E0DB]">
      <span className="block text-[14px] tracking-[0.3em] uppercase text-tk-ink">Saudagar</span>
      <span className="block text-[12px] uppercase tracking-[0.18em] text-tk-accent mt-0.5">Store admin</span>
    </Link>
  );

  const footer = (
    <div className="border-t border-[#E2E0DB] p-4 space-y-2">
      <p className="text-[12px] text-[#4F4F4F] truncate" title={user?.email ?? ''}>
        {user?.email}
      </p>
      <div className="flex gap-2">
        <a href="/" target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#C4C1B9] px-2 py-1.5 text-[12px] text-[#454545] hover:border-tk-ink">
          <ExternalLink size={13} /> View store
        </a>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center justify-center gap-1.5 border border-[#C4C1B9] px-2 py-1.5 text-[12px] text-[#454545] hover:border-tk-ink">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <GuideContext.Provider value={guide}>
    <div className="admin-root min-h-screen bg-[#F8F7F5] text-tk-ink font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col bg-white border-r border-[#E2E0DB]">
        {brand}
        <NavList />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-[#E2E0DB] px-4 h-14">
        <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="p-2 -ml-2">
          <Menu size={20} />
        </button>
        <span className="text-[14px] tracking-[0.3em] uppercase">Saudagar</span>
        <div className="flex items-center">
          <SearchButton compact onClick={() => setSearchOpen(true)} />
          <button type="button" aria-label="How this page works" onClick={() => setHelpOpen(true)} className="p-2 text-[#454545] hover:text-tk-ink">
            <CircleHelp size={18} />
          </button>
          <NotificationsBell />
        </div>
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
        <div className="hidden lg:flex items-center gap-3 mx-auto max-w-[1200px] px-8 pt-4 -mb-2">
          <div className="flex-1">
            <SearchButton onClick={() => setSearchOpen(true)} />
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1.5 border border-[#C4C1B9] bg-white px-3 py-2 text-[13.5px] text-[#454545] hover:border-tk-ink hover:text-tk-ink"
          >
            <CircleHelp size={15} aria-hidden /> Help
          </button>
          <NotificationsBell />
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
