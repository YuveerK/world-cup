import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, Menu, Trophy, User, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

// ─── Link class helpers ───────────────────────────────────────────────────────

const desktopLinkCls = ({ isActive }) =>
  [
    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');

const drawerLinkCls = ({ isActive }) =>
  [
    'block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ');

// ─── Shared dropdown hook ─────────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return { open, setOpen, ref };
}

// ─── Generic nav dropdown ─────────────────────────────────────────────────────

function NavDropdown({ label, activeRoutes, alignRight = false, children }) {
  const { open, setOpen, ref } = useDropdown();
  const location = useLocation();
  const isActive = activeRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        ].join(' ')}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 min-w-[168px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 font-semibold text-blue-700'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

// ─── User avatar + dropdown ───────────────────────────────────────────────────

function UserDropdown({ user, onLogout }) {
  const { open, setOpen, ref } = useDropdown();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
          {initials}
        </div>
        <span className="hidden xl:block">{user?.username}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            Profile
          </NavLink>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main header ──────────────────────────────────────────────────────────────

export function AppHeader() {
  const { isAuthed, isRestoringSession, isAdmin, logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const showNav = isAuthed || isRestoringSession;

  return (
    <>
      <header className="sticky top-0 z-[1000] bg-white shadow-[0_1px_8px_0_rgba(0,0,0,0.07)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-8 lg:px-12">

          {/* ── Left: Brand ── */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_4px_12px_-4px_rgba(250,204,21,0.75)] ring-1 ring-black/5">
              <Trophy className="h-[18px] w-[18px]" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                World Cup 2026
              </p>
              <p className="text-sm font-extrabold tracking-tight text-slate-900">
                Prediction League
              </p>
            </div>
          </Link>

          {showNav && (
            <>
              {/* ── Center: Desktop nav ── */}
              <nav
                className="hidden items-center gap-0.5 lg:flex"
                aria-label="Main navigation"
              >
                <NavLink to="/" end className={desktopLinkCls}>
                  Predictions
                </NavLink>
                <NavLink to="/leaderboard" className={desktopLinkCls}>
                  Leaderboard
                </NavLink>
                <NavDropdown
                  label="Tournament"
                  activeRoutes={['/standings', '/knockout', '/road-to-final', '/map']}
                >
                  <DropdownLink to="/standings">Standings</DropdownLink>
                  <DropdownLink to="/knockout">Knockout</DropdownLink>
                  <DropdownLink to="/road-to-final">Road to Final</DropdownLink>
                  <DropdownLink to="/map">Map</DropdownLink>
                </NavDropdown>
                <NavLink to="/reports" className={desktopLinkCls}>
                  Reports
                </NavLink>
              </nav>

              {/* ── Right: User actions ── */}
              <div className="hidden items-center gap-1 lg:flex">
                {isAdmin && (
                  <NavDropdown
                    label="Admin"
                    activeRoutes={['/admin', '/dev/cards']}
                    alignRight
                  >
                    <DropdownLink to="/admin">Admin</DropdownLink>
                    <DropdownLink to="/dev/cards">Preview</DropdownLink>
                  </NavDropdown>
                )}
                {user && <UserDropdown user={user} onLogout={logout} />}
              </div>

              {/* ── Hamburger (mobile) ── */}
              <button
                type="button"
                onClick={() => setDrawerOpen((v) => !v)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav"
              >
                {drawerOpen
                  ? <X className="h-4 w-4" aria-hidden="true" />
                  : <Menu className="h-4 w-4" aria-hidden="true" />
                }
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Mobile side drawer ── */}
      {showNav && createPortal(
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className={`fixed inset-0 z-[9998] bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
              drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          {/* Drawer */}
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className={`fixed right-0 top-0 z-[9999] flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase leading-none tracking-widest text-amber-500">
                    World Cup 2026
                  </p>
                  {user && (
                    <p className="mt-1 text-sm font-bold leading-none text-slate-900">
                      Welcome, {user.username}!
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Drawer nav — scrollable */}
            <nav className="flex-1 overflow-y-auto px-4 pt-4 pb-2" aria-label="Mobile navigation">
              <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Main
              </p>
              <div className="space-y-0.5">
                <NavLink to="/" end className={drawerLinkCls}>Predictions</NavLink>
                <NavLink to="/leaderboard" className={drawerLinkCls}>Leaderboard</NavLink>
                <NavLink to="/reports" className={drawerLinkCls}>Reports</NavLink>
              </div>

              <p className="mb-1 mt-6 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Tournament
              </p>
              <div className="space-y-0.5">
                <NavLink to="/standings" className={drawerLinkCls}>Standings</NavLink>
                <NavLink to="/knockout" className={drawerLinkCls}>Knockout</NavLink>
                <NavLink to="/road-to-final" className={drawerLinkCls}>Road to Final</NavLink>
                <NavLink to="/map" className={drawerLinkCls}>Map</NavLink>
              </div>

              {isAdmin && (
                <>
                  <p className="mb-1 mt-6 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Admin
                  </p>
                  <div className="space-y-0.5">
                    <NavLink to="/admin" className={drawerLinkCls}>Admin</NavLink>
                    <NavLink to="/dev/cards" className={drawerLinkCls}>Preview</NavLink>
                  </div>
                </>
              )}

              <p className="mb-1 mt-6 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Account
              </p>
              <div className="space-y-0.5">
                <NavLink to="/profile" className={drawerLinkCls}>Profile</NavLink>
              </div>
            </nav>

            {/* Sign out — sticky at viewport bottom */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={logout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
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
