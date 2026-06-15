import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, Trophy, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

// Core navigation — always visible to authenticated users
const CORE_NAV = [
  { to: '/', label: 'Predictions', end: true },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/standings', label: 'Standings' },
  { to: '/knockout', label: 'Knockout' },
  { to: '/reports', label: 'Reports' },
];

// Account-level navigation — visible to all authenticated users
const USER_NAV = [{ to: '/profile', label: 'Profile' }];

// Admin-only navigation — prepended before USER_NAV for admins
const ADMIN_NAV = [
  { to: '/admin', label: 'Admin' },
  { to: '/dev/cards', label: 'Preview' },
];

const desktopLinkClass = ({ isActive }) =>
  [
    'px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
    isActive
      ? 'bg-blue-50 text-blue-700 font-semibold'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');

const drawerLinkClass = ({ isActive }) =>
  [
    'block rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-blue-50 text-blue-700 font-semibold'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');

export function AppHeader() {
  const { isAuthed, isRestoringSession, isAdmin, logout: onLogout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const utilityNav = isAdmin ? [...ADMIN_NAV, ...USER_NAV] : USER_NAV;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* ── Brand / greeting ── */}
          <div className="flex shrink-0 items-center gap-3">
            {user ? (
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                  World Cup 2026
                </p>
                <p className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                  Welcome, {user.username}!
                </p>
              </div>
            ) : (
              <>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_8px_20px_-6px_rgba(250,204,21,0.75)] ring-1 ring-black/5 sm:h-11 sm:w-11">
                  <Trophy className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden="true" />
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                    World Cup 2026
                  </p>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                    Prediction League
                  </h1>
                </div>
              </>
            )}
          </div>

          {(isAuthed || isRestoringSession) && (
            <>
              {/* ── Desktop navigation ── */}
              <nav
                className="hidden items-center gap-1 lg:flex"
                aria-label="Main navigation"
              >
                {/* Core links */}
                {CORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={desktopLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}

                {/* Vertical rule separating core from utilities */}
                <span className="mx-2 inline-block h-4 w-px bg-slate-200" aria-hidden="true" />

                {/* Utility links */}
                {utilityNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={desktopLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}

                {/* Sign out — distinct treatment to signal it's an action */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </nav>

              {/* ── Hamburger (mobile) ── */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors duration-200 hover:bg-slate-100 lg:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="mobile-nav"
              >
                {open
                  ? <X className="h-4 w-4" aria-hidden="true" />
                  : <Menu className="h-4 w-4" aria-hidden="true" />
                }
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Mobile side drawer (portalled to body) ── */}
      {(isAuthed || isRestoringSession) && createPortal(
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
              open ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          {/* Drawer panel */}
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                {user ? (
                  <div className="leading-tight">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                      World Cup 2026
                    </p>
                    <p className="text-sm font-bold text-slate-900">Welcome, {user.username}!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_4px_12px_-4px_rgba(250,204,21,0.8)]">
                      <Trophy className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        World Cup 2026
                      </p>
                      <p className="text-sm font-bold text-slate-900">Prediction League</p>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Drawer nav — scrollable */}
            <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
              <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Menu
              </p>
              <div className="space-y-0.5">
                {CORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={drawerLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="my-4 border-t border-slate-100" />

              <p className="mb-1.5 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Account
              </p>
              <div className="space-y-0.5">
                {utilityNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={drawerLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* Sign out pinned at bottom */}
            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-100 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
