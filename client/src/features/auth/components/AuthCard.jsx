import { useState } from 'react';
import { Activity, AlertCircle, CalendarDays, CheckCircle2, Loader2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { Flag } from '@/features/matches/components/Flag';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingRows } from '@/components/feedback/LoadingPanel';
import { formatDate, formatTime } from '@/lib/date/index';
import { canShowMatchDetails, displayStatus, hasMatchScore, scoreStatusLabel, scoreText } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';

export function AuthCard({ authMode, setAuthMode, credentials, setCredentials, handleAuth, busy, loading, fixtures, onViewStats, notice }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const showcaseMatches = [...fixtures]
    .sort((a, b) => {
      const rank = (match) => {
        if (match.status === 'LIVE') return 0;
        if (displayStatus(match) === 'FINISHED' || hasMatchScore(match)) return 1;
        return 2;
      };
      const rankDiff = rank(a) - rank(b);
      if (rankDiff) return rankDiff;
      return new Date(a.date || 0) - new Date(b.date || 0);
    })
    .slice(0, 3);

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
    <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      <form className="panel p-6" onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-blue-700">Prediction League</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {authMode === 'signup' ? 'Join and start predicting match scores' : 'Sign in to manage your predictions'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button type="button"
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => switchMode('signup')}>
            Sign up
          </button>
          <button type="button"
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => switchMode('login')}>
            Log in
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Username</span>
            <input
              className="field"
              value={credentials.username}
              onChange={(e) => { setCredentials((c) => ({ ...c, username: e.target.value })); setValidationError(null); }}
              autoComplete="username"
              minLength={2}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Password</span>
            <input
              className="field"
              type="password"
              value={credentials.password}
              onChange={(e) => { setCredentials((c) => ({ ...c, password: e.target.value })); setValidationError(null); }}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
            {authMode === 'signup' && (
              <p className="text-[11px] text-slate-400">Minimum 8 characters</p>
            )}
          </label>
          {authMode === 'signup' && (
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Confirm password</span>
              <input
                className="field"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}
        </div>

        {inlineError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-sm font-medium text-red-700">{inlineError}</p>
          </div>
        )}
        {inlineSuccess && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <p className="text-sm font-medium text-emerald-700">{inlineSuccess}</p>
          </div>
        )}

        <button className="btn btn-primary mt-5 w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> :
            authMode === 'signup' ? <UserPlus className="h-4 w-4" aria-hidden="true" /> :
            <LogIn className="h-4 w-4" aria-hidden="true" />}
          {authMode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Fixtures</h2>
        </div>

        {loading ? (
          <LoadingRows />
        ) : showcaseMatches.length ? (
          <div className="grid gap-3">
            {showcaseMatches.map((match) => {
              const isLive = match.status === 'LIVE';
              return (
                <div key={match.id} className={`rounded-xl border p-4 transition ${
                  isLive ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">{formatDate(match.date)}</span>
                    {hasMatchScore(match) ? (
                      <div className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        isLive ? 'bg-blue-100 text-blue-700' : 'bg-slate-900 text-white'
                      }`}>
                        {isLive && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />}
                        {scoreStatusLabel(match)} {scoreText(match)}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{formatTime(match.date)}</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2.5">
                      <Flag team={match.home} />
                      <span className="text-sm font-semibold text-slate-800">{teamName(match.home)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Flag team={match.away} />
                      <span className="text-sm font-semibold text-slate-800">{teamName(match.away)}</span>
                    </div>
                  </div>
                  {canShowMatchDetails(match) && (
                    <button className="btn btn-secondary mt-3 w-full" onClick={() => onViewStats(match)}>
                      <Activity className="h-4 w-4" aria-hidden="true" />
                      Match details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Fixtures unavailable" detail="Start the backend API to load live tournament data." />
        )}
      </div>
    </div>
  );
}
