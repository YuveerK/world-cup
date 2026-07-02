import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { displayStatus, hasMatchScore } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { formatDate, formatTime } from '@/lib/date/index';

function getResult(match, team) {
  if (!hasMatchScore(match)) return null;
  const isHome = match.home?.name === team.name || match.home?.abbreviation === team.code;
  const hs = Number(match.score.home);
  const as = Number(match.score.away);
  if (hs === as) return 'D';
  if (isHome) return hs > as ? 'W' : 'L';
  return as > hs ? 'W' : 'L';
}

export function TeamResultsSheet({ team, row, groupName, matches, onClose }) {
  const open = !!team;

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[1090] bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={team ? `${team.name} results` : 'Team results'}
        className={`fixed right-0 top-0 z-[1100] flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {open && (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                {team.flag ? (
                  <img
                    src={team.flag}
                    alt={team.name}
                    className="h-9 w-12 shrink-0 rounded border border-slate-100 object-cover"
                  />
                ) : (
                  <span className="grid h-9 w-12 shrink-0 place-items-center rounded border border-slate-100 bg-slate-100 text-xs font-bold text-slate-400">
                    {team.code}
                  </span>
                )}
                <div>
                  <p className="text-base font-extrabold text-slate-900">{team.name || team.code}</p>
                  {groupName && <p className="text-xs text-slate-400">{groupName}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Group record summary */}
            {row && (
              <div className="grid grid-cols-6 divide-x divide-slate-100 border-b border-slate-200 bg-white">
                {[
                  { label: 'P',   value: row.mp },
                  { label: 'W',   value: row.w  },
                  { label: 'D',   value: row.d  },
                  { label: 'L',   value: row.l  },
                  { label: 'GD',  value: row.gd > 0 ? `+${row.gd}` : row.gd },
                  { label: 'Pts', value: row.pts },
                ].map(({ label, value }) => (
                  <div key={label} className="py-3 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Match list */}
            <div className="flex-1 overflow-y-auto">
              {matches.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-400">No matches found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {matches.map((match) => {
                    const isHome = match.home?.name === team.name || match.home?.abbreviation === team.code;
                    const opponent = isHome ? match.away : match.home;
                    const status = displayStatus(match);
                    const scored = hasMatchScore(match);
                    const result = getResult(match, team);
                    const score = scored
                      ? `${match.score.home} – ${match.score.away}`
                      : null;

                    return (
                      <div key={match.id} className="flex items-center gap-3 bg-white px-5 py-4">
                        {/* Date */}
                        <div className="w-14 shrink-0 text-left">
                          <p className="text-[10px] font-semibold text-slate-500">{formatDate(match.date)}</p>
                          <p className="text-[10px] tabular-nums text-slate-400">{formatTime(match.date)}</p>
                        </div>

                        {/* Opponent */}
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          {opponent?.flagUrl ? (
                            <img
                              src={opponent.flagUrl}
                              alt=""
                              className="h-5 w-7 shrink-0 rounded-sm border border-slate-100 object-cover"
                            />
                          ) : (
                            <span className="grid h-5 w-7 shrink-0 place-items-center rounded-sm border border-slate-100 bg-slate-100 text-[8px] font-bold text-slate-400">
                              {opponent?.abbreviation ?? '?'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {teamName(opponent)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isHome ? 'Home' : 'Away'}
                              {match.group ? ` · ${match.group}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Score + result */}
                        <div className="flex shrink-0 items-center gap-2">
                          {score && (
                            <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                              {score}
                            </span>
                          )}
                          {result ? (
                            <ResultBadge result={result} />
                          ) : status === 'LIVE' ? (
                            <span className="rounded-full bg-red-100/80 px-2 py-0.5 text-[9px] font-bold text-red-700">
                              Live
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

function ResultBadge({ result }) {
  const cls = {
    W: 'bg-emerald-100 text-emerald-700',
    D: 'bg-amber-100 text-amber-700',
    L: 'bg-red-100 text-red-600',
  }[result] ?? 'bg-slate-100 text-slate-500';

  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${cls}`}>
      {result}
    </span>
  );
}
