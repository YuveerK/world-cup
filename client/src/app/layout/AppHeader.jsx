import { useEffect, useState } from 'react';
import { LogOut, Menu, Trophy, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Predictions', end: true },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/summaries', label: 'Summaries' },
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

const mobileLinkClass = ({ isActive }) =>
  [
    'block rounded-xl px-4 py-3 text-base font-semibold transition',
    isActive
      ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-blue-950 shadow-[0_8px_24px_-10px_rgba(250,204,21,0.9)]'
      : 'text-blue-100/90 hover:bg-blue-900/50 hover:text-white',
  ].join(' ');

export function AppHeader({ isAuthed, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navItems = isAdmin ? [...NAV_ITEMS, { to: '/admin', label: 'Admin' }] : NAV_ITEMS;

  return (
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
                <LogOut
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Sign out
              </button>
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-300/20 bg-blue-950/40 text-blue-100 transition hover:bg-blue-900/60 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isAuthed && (
        <div
          id="mobile-nav"
          className={`overflow-hidden border-t border-blue-400/10 transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
            open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-3 sm:px-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={mobileLinkClass}>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-base font-semibold text-rose-100 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
