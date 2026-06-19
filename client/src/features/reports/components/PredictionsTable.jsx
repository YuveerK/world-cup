import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { formatDate, formatTime } from '@/lib/date/index';
import { outcomeLabel } from '@/features/matches/utils/matchFormatters';
import { timeBeforeKickoff } from '../utils/timing';
import { ScorePick } from './ScorePick';

export function PredictionsTable({ rows, currentUser, matchDate, actualResult }) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const totalA = (a.ht_pts || 0) + (a.ft_pts || 0) + (a.closest_pts || 0) + (a.outcome_pts || 0);
      const totalB = (b.ht_pts || 0) + (b.ft_pts || 0) + (b.closest_pts || 0) + (b.outcome_pts || 0);
      return totalB - totalA;
    });
  }, [rows]);

  const submissionStats = useMemo(() => {
    const times = rows
      .filter((r) => r.submitted_at)
      .map((r) => new Date(r.submitted_at).getTime())
      .filter(Number.isFinite);
    if (!times.length) return null;
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times));
    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    return { earliest, latest, avg: new Date(avgMs) };
  }, [rows]);

  const hasScored = rows.some((r) => r.ht_pts != null || r.ft_pts != null);

  return (
    <div className="space-y-3">
      {actualResult && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Match result</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {actualResult.ht_home != null && (
                <span className="text-sm font-black tabular-nums text-emerald-900">
                  HT {actualResult.ht_home} – {actualResult.ht_away}
                </span>
              )}
              <span className="text-xs text-emerald-400">·</span>
              <span className="text-sm font-black tabular-nums text-emerald-900">
                FT {actualResult.ft_home} – {actualResult.ft_away}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                {outcomeLabel(actualResult.ft_home, actualResult.ft_away)}
              </span>
            </div>
          </div>
        </div>
      )}

      {submissionStats && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {[
            { label: 'Earliest', value: timeBeforeKickoff(submissionStats.earliest, matchDate) },
            { label: 'Latest',   value: timeBeforeKickoff(submissionStats.latest, matchDate) },
            { label: 'Average',  value: timeBeforeKickoff(submissionStats.avg, matchDate) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {sorted.map((row, i) => {
          const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
          const isYou = String(row.user_id) === String(currentUser?.id);
          const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
          const submitted = timeBeforeKickoff(row.submitted_at, matchDate);
          const htEarned = (row.ht_pts || 0) > 0;
          const ftEarned = (row.ft_pts || 0) > 0;
          const outEarned = (row.outcome_pts || 0) > 0;
          const clsEarned = roundPoints(row.closest_pts || 0) > 0;
          const htActual = actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null;
          const ftActual = actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null;

          return (
            <div key={row.user_id} className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                  <span className="truncate font-bold text-slate-900">{username}</span>
                  {isYou && <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${total > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  {total} pts
                </span>
              </div>

              {row.ft_home != null && (
                <div className="border-t border-slate-100 px-3.5 py-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-lg px-2.5 py-2 ${htEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !htEarned && hasScored && row.ht_home != null ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${htEarned && hasScored ? 'text-emerald-500' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-400' : 'text-slate-400'}`}>Half time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${htEarned && hasScored ? 'text-emerald-700' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-600' : row.ht_home != null ? 'text-slate-700' : 'text-slate-300'}`}>
                        {row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : '—'}
                      </p>
                      {hasScored && !htEarned && row.ht_home != null && htActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {htActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${htEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{htEarned ? `+${row.ht_pts} pts` : '0 pts'}</p>}
                    </div>
                    <div className={`rounded-lg px-2.5 py-2 ${ftEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !ftEarned && hasScored ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${ftEarned && hasScored ? 'text-emerald-500' : !ftEarned && hasScored ? 'text-rose-400' : 'text-slate-400'}`}>Full time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${ftEarned && hasScored ? 'text-emerald-700' : !ftEarned && hasScored ? 'text-rose-600' : 'text-slate-700'}`}>
                        {row.ft_home}–{row.ft_away}
                      </p>
                      {hasScored && !ftEarned && ftActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {ftActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${ftEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{ftEarned ? `+${row.ft_pts} pts` : '0 pts'}</p>}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {hasScored && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${outEarned ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {outEarned ? '✓ ' : ''}{outcomeLabel(row.ft_home, row.ft_away)} {outEarned ? `+${row.outcome_pts}` : '0'}
                      </span>
                    )}
                    {!hasScored && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {outcomeLabel(row.ft_home, row.ft_away)}
                      </span>
                    )}
                    {clsEarned && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                        ✓ Closest +{roundPoints(row.closest_pts)}
                      </span>
                    )}
                    {submitted && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {submitted}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Player</th>
                <th className="px-3 py-2.5 text-center">
                  HT pick
                  {actualResult?.ht_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ht_home}–{actualResult.ht_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">
                  FT pick
                  {actualResult?.ft_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ft_home}–{actualResult.ft_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">HT pts</th>
                <th className="px-3 py-2.5 text-center">FT pts</th>
                <th className="px-3 py-2.5 text-center">Cls</th>
                <th className="px-3 py-2.5 text-center">Out</th>
                <th className="px-3 py-2.5 text-center">Submitted</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((row, i) => {
                const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
                const isYou = String(row.user_id) === String(currentUser?.id);
                const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
                const ptsCell = (val) => <span className={val > 0 ? 'font-bold text-emerald-700' : 'text-slate-400'}>{val}</span>;
                const htEarned = (row.ht_pts || 0) > 0;
                const ftEarned = (row.ft_pts || 0) > 0;
                return (
                  <tr key={row.user_id} className={isYou ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                    <td className="w-8 px-3 py-2.5 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{username}</span>
                        {isYou && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : null}
                        actual={actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null}
                        earned={htEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ft_home != null ? `${row.ft_home}–${row.ft_away}` : null}
                        actual={actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null}
                        earned={ftEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ht_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ft_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(roundPoints(row.closest_pts || 0))}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.outcome_pts || 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-[11px] text-slate-500">
                      {row.submitted_at ? `${formatDate(row.submitted_at)} · ${formatTime(row.submitted_at)}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
