import { useState } from 'react';
import { AlertCircle, CheckCircle2, Check, Loader2, LogIn, Trophy, UserPlus } from 'lucide-react';

const STADIUM_IMG = '/login-banner.png';

const FEATURES = [
  'Live match tracking',
  'Real-time leaderboard',
  'Score predictions',
  'Match analysis',
];

export function AuthCard({ authMode, setAuthMode, credentials, setCredentials, handleAuth, busy, notice }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  function switchMode(mode) {
    setAuthMode(mode);
    setConfirmPassword('');
    setValidationError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError(null);

    const username = credentials.username.trim();
    const { password } = credentials;

    if (username.length < 2) {
      setValidationError('Username must be at least 2 characters.');
      return;
    }
    if (/\s/.test(username)) {
      setValidationError('Username cannot contain spaces.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (authMode === 'signup' && password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    handleAuth(e);
  }

  const inlineError = validationError ?? (notice?.type === 'error' ? notice.message : null);
  const inlineSuccess = !validationError && notice?.type === 'success' ? notice.message : null;

  return (
    <div className="flex min-h-screen">

      {/* ── Left: hero panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[58%] lg:flex-col lg:justify-between p-14">
        {/* Stadium background photo */}
        <img
          src={STADIUM_IMG}
          alt="Packed football stadium"
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden="true"
        />
        {/* Dark base layer */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Top and bottom fade for logo + stats legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
            <Trophy className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">World Cup 2026</p>
            <p className="text-sm font-bold text-white">Prediction League</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-4">
            <p className="inline-block rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
              The official prediction league
            </p>
          </div>
          <h1 className="text-[3.5rem] font-black leading-[1.08] tracking-tight text-white drop-shadow-lg">
            Predict.<br />Compete.<br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Win.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-slate-300 drop-shadow">
            Call every match result, climb the live leaderboard, and prove you know football better than everyone else.
          </p>

          <div className="mt-10 flex flex-wrap gap-2.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8">
          {[['48', 'Teams'], ['104', 'Matches'], ['USA · MEX · CAN', 'Host nations']].map(([val, label]) => (
            <div key={label}>
              <p className="text-xl font-black text-white">{val}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <Trophy className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">World Cup 2026</p>
              <p className="text-sm font-bold text-slate-900">Prediction League</p>
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {authMode === 'signup'
              ? 'Join the league and start predicting'
              : 'Sign in to manage your predictions'}
          </p>

          {/* Tab switcher */}
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Form */}
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Username</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={credentials.username}
                onChange={(e) => { setCredentials((c) => ({ ...c, username: e.target.value })); setValidationError(null); }}
                autoComplete="username"
                placeholder="e.g. Yuveer"
                minLength={2}
                required
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</span>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={credentials.password}
                onChange={(e) => { setCredentials((c) => ({ ...c, password: e.target.value })); setValidationError(null); }}
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </label>

            {authMode === 'signup' && (
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirm password</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  minLength={8}
                  required
                />
              </label>
            )}

            {inlineError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="text-sm font-medium text-red-700">{inlineError}</p>
              </div>
            )}
            {inlineSuccess && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                <p className="text-sm font-medium text-emerald-700">{inlineSuccess}</p>
              </div>
            )}

            <button
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
              disabled={busy}
            >
              {busy
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : authMode === 'signup'
                  ? <UserPlus className="h-4 w-4" aria-hidden="true" />
                  : <LogIn className="h-4 w-4" aria-hidden="true" />}
              {authMode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Invite-only league — contact the admin if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
