import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, Trophy, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Predictions', end: true },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/profile', label: 'Profile' },
];

const navLinkClass = ({ isActive }) =>
  [
    'relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300',
    isActive
      ? 'text-blue-950 shadow-[0_8px_24px_-8px_rgba(250,204,21,0.8)]'
      : 'text-blue-100/80 hover:text-white',
  ].join(' ');

function NavPill({ to, label, end }) {
  return (
    <NavLink to={to} end={end} className={navLinkClass}>
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400"
            />
          )}
          {label}
        </>
      )}
    </NavLink>
  );
}

const drawerLinkClass = ({ isActive }) =>
  [
    'block rounded-xl px-4 py-3.5 text-base font-semibold transition-all duration-200',
    isActive
      ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-blue-950 shadow-[0_8px_20px_-8px_rgba(250,204,21,0.8)]'
      : 'text-blue-100/90 hover:bg-blue-800/50 hover:text-white',
  ].join(' ');

export function AppHeader({ isAuthed, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/admin', label: 'Admin' }, { to: '/dev/cards', label: 'Preview' }]
    : NAV_ITEMS;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-blue-400/20 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent"
        />
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -top-20 right-1/4 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_10px_30px_-8px_rgba(250,204,21,0.9)] ring-1 ring-white/30 sm:h-12 sm:w-12">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90 sm:text-[11px]">
                World Cup 2026
              </p>
              <h1 className="truncate bg-gradient-to-r from-white to-slate-300 bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-2xl">
                Prediction League
              </h1>
            </div>
          </div>

          {isAuthed && (
            <>
              {/* Desktop nav */}
              <nav className="hidden items-center gap-3 lg:flex">
                <div className="flex items-center gap-1 rounded-full border border-blue-300/15 bg-blue-950/40 p-1 shadow-inner shadow-black/30 backdrop-blur">
                  {navItems.map((item) => (
                    <NavPill key={item.to} {...item} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="group inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-100/80 transition-all duration-300 hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-white"
                >
                  <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
                  Sign out
                </button>
              </nav>

              {/* Hamburger toggle */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-300/20 bg-blue-950/40 text-blue-100 transition hover:bg-blue-900/60 lg:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="mobile-nav"
              >
                <span className={`absolute transition-all duration-200 ${open ? 'rotate-90 opacity-100' : 'rotate-0 opacity-0'}`}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={`absolute transition-all duration-200 ${open ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Side drawer — rendered at body level to escape header stacking context */}
      {isAuthed && createPortal(
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-40 bg-blue-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              open ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          {/* Drawer panel */}
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Decorative glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="absolute -left-10 bottom-20 h-36 w-36 rounded-full bg-blue-400/10 blur-3xl" />
            </div>

            {/* Drawer header */}
            <div className="relative flex items-center justify-between border-b border-blue-400/20 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_6px_18px_-6px_rgba(250,204,21,0.8)]">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-white">Navigation</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-blue-300/20 text-blue-200 transition hover:bg-blue-800/60 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={drawerLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Sign out pinned at bottom */}
            <div className="relative border-t border-blue-400/20 p-4">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-base font-semibold text-rose-100 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
