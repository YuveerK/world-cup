import { createPortal } from 'react-dom';
import { AlertCircle, Eye, Loader2, X } from 'lucide-react';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';
import { MatchPredictionsTable } from './MatchPredictionsTable';

export function MatchPredictionsSheet({
  match,
  rows = [],
  currentUser,
  actualResult,
  loading,
  error,
  onClose,
}) {
  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          match ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={match ? `Predictions: ${matchTitle(match)}` : 'Match predictions'}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
          match ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <SheetHeader match={match} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-5">
          {match && (
            <>
              <MatchSummary match={match} />
              <SheetContent
                match={match}
                rows={rows}
                currentUser={currentUser}
                actualResult={actualResult}
                loading={loading}
                error={error}
              />
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

function SheetHeader({ match, onClose }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Eye className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Predictions</p>
          <p className="truncate text-sm font-black text-slate-950">{match ? matchTitle(match) : '-'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MatchSummary({ match }) {
  const status = displayStatus(match);

  return (
    <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col items-center gap-1.5">
        <Flag team={match.home} />
        <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(match.home)}</p>
      </div>
      <div className="text-center">
        {hasMatchScore(match) ? (
          <p className="text-3xl font-black tabular-nums text-slate-950">{scoreText(match)}</p>
        ) : (
          <p className="text-base font-black uppercase text-slate-400">VS</p>
        )}
        <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClass(status)}`}>
          {status}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Flag team={match.away} />
        <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(match.away)}</p>
      </div>
    </div>
  );
}

function SheetContent({ match, rows, currentUser, actualResult, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-16 text-sm font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading predictions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-amber-400" aria-hidden="true" />
        <div>
          <p className="font-bold text-slate-900">Could not load predictions</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-slate-300" aria-hidden="true" />
        <div>
          <p className="font-bold text-slate-900">No predictions yet</p>
          <p className="mt-1 text-sm text-slate-500">No players have submitted a prediction for this match.</p>
        </div>
      </div>
    );
  }

  return (
    <MatchPredictionsTable
      rows={rows}
      currentUser={currentUser}
      actualResult={actualResult}
    />
  );
}

function getStatusClass(status) {
  if (status === 'FINISHED') return 'text-blue-600';
  if (status === 'LIVE') return 'text-red-600';
  return 'text-amber-600';
}
