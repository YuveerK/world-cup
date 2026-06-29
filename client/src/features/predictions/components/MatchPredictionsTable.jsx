import { useMemo } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { outcomeLabel } from '@/features/matches/utils/matchFormatters';
import { formatPlacedAt } from '../utils/predictionTiming';
import {
  getPredictionRowTotal,
  getPredictionUsername,
  getSubmissionStats,
  hasScoredPredictionRows,
  scorePair,
  sortPredictionRowsByPoints,
} from '../utils/predictionRows';

const EMPTY = '—';

export function MatchPredictionsTable({ rows = [], currentUser, actualResult }) {
  const sorted = useMemo(() => sortPredictionRowsByPoints(rows), [rows]);
  const submissionStats = useMemo(() => getSubmissionStats(rows), [rows]);
  const hasScored = hasScoredPredictionRows(rows);

  // Show ET/pen columns when the actual result has those scores OR when any
  // player has made an ET/pen prediction (upcoming knockout matches).
  const showEt = actualResult?.et_ft_home != null || rows.some((r) => r.et_ft_home != null);
  const showEtHt = showEt && (actualResult?.et_ht_home != null || rows.some((r) => r.et_ht_home != null));
  const showPen = actualResult?.pen_home != null || rows.some((r) => r.pen_home != null);

  return (
    <div className="space-y-3">
      {(actualResult || submissionStats) && (
        <MatchContextHeader actualResult={actualResult} submissionStats={submissionStats} />
      )}
      <MobilePredictionCards
        rows={sorted}
        currentUser={currentUser}
        actualResult={actualResult}
        hasScored={hasScored}
      />
      <DesktopPredictionsTable
        rows={sorted}
        currentUser={currentUser}
        actualResult={actualResult}
        hasScored={hasScored}
        showEt={showEt}
        showEtHt={showEtHt}
        showPen={showPen}
      />
    </div>
  );
}

// ─── Unified match context header ─────────────────────────────────────────────

function MatchContextHeader({ actualResult, submissionStats }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {actualResult && (
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 ${submissionStats ? 'border-b border-slate-100' : ''}`}>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400">Result</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {actualResult.ht_home != null && (
                <>
                  <span className="text-base font-black tabular-nums text-slate-900">
                    HT {actualResult.ht_home}–{actualResult.ht_away}
                  </span>
                  <span className="text-slate-300">·</span>
                </>
              )}
              <span className="text-base font-black tabular-nums text-slate-900">
                FT {actualResult.ft_home}–{actualResult.ft_away}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                {outcomeLabel(actualResult.ft_home, actualResult.ft_away)}
              </span>
              {actualResult.et_ft_home != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-base font-black tabular-nums text-orange-700">
                    ET {actualResult.et_ft_home}–{actualResult.et_ft_away}
                  </span>
                </>
              )}
              {actualResult.pen_home != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-base font-black tabular-nums text-rose-700">
                    Pens {actualResult.pen_home}–{actualResult.pen_away}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {submissionStats && (
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          {[
            { label: 'Earliest', value: formatPlacedAt(submissionStats.earliest) },
            { label: 'Latest',   value: formatPlacedAt(submissionStats.latest) },
            { label: 'Average',  value: formatPlacedAt(submissionStats.avg) },
          ].map(({ label, value }) => (
            <div key={label} className="py-3 text-center">
              <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-300">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{value ?? EMPTY}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile cards ─────────────────────────────────────────────────────────────

function MobilePredictionCards({ rows, currentUser, actualResult, hasScored }) {
  return (
    <div className="space-y-2 sm:hidden">
      {rows.map((row, index) => (
        <MobilePredictionCard
          key={row.user_id}
          row={row}
          rank={index + 1}
          currentUser={currentUser}
          actualResult={actualResult}
          hasScored={hasScored}
        />
      ))}
    </div>
  );
}

function MobilePredictionCard({ row, rank, currentUser, actualResult, hasScored }) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const submitted = formatPlacedAt(row.submitted_at);

  const outEarned = (row.outcome_pts || 0) > 0;
  const clsEarned = roundPoints(row.closest_pts || 0) > 0;
  const etClsEarned = roundPoints(row.et_closest_pts || 0) > 0;
  const penClsEarned = roundPoints(row.pen_closest_pts || 0) > 0;

  const phases = [
    { label: 'HT',    pick: scorePair(row.ht_home, row.ht_away),         hasPick: row.ht_home != null,    earned: (row.ht_pts || 0) > 0,        pts: row.ht_pts,        color: 'emerald' },
    { label: 'FT',    pick: scorePair(row.ft_home, row.ft_away),         hasPick: row.ft_home != null,    earned: (row.ft_pts || 0) > 0,        pts: row.ft_pts,        color: 'emerald' },
    { label: 'ET HT', pick: scorePair(row.et_ht_home, row.et_ht_away),   hasPick: row.et_ht_home != null, earned: (row.et_ht_pts || 0) > 0,     pts: row.et_ht_pts,     color: 'orange'  },
    { label: 'ET FT', pick: scorePair(row.et_ft_home, row.et_ft_away),   hasPick: row.et_ft_home != null, earned: (row.et_ft_pts || 0) > 0,     pts: row.et_ft_pts,     color: 'orange'  },
    { label: 'Pens',  pick: scorePair(row.pen_home, row.pen_away),       hasPick: row.pen_home != null,   earned: (row.pen_exact_pts || 0) > 0, pts: row.pen_exact_pts, color: 'rose'    },
  ].filter((p) => p.hasPick);

  const bonusBadges = [
    outEarned  && { label: `${outcomeLabel(row.ft_home, row.ft_away)} +${row.outcome_pts}`,    color: 'emerald' },
    clsEarned  && { label: `Closest +${roundPoints(row.closest_pts)}`,                         color: 'emerald' },
    etClsEarned && { label: `ET Closest +${roundPoints(row.et_closest_pts)}`,                  color: 'orange'  },
    penClsEarned && { label: `Pen Closest +${roundPoints(row.pen_closest_pts)}`,               color: 'rose'    },
  ].filter(Boolean);

  return (
    <div className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{rank}</span>
          <span className="truncate font-bold text-slate-900">{username}</span>
          {isYou && (
            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>
          )}
        </div>
        {total > 0
          ? <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black tabular-nums text-emerald-700">+{total}</span>
          : <span className="shrink-0 text-sm font-bold text-slate-300">{EMPTY}</span>
        }
      </div>

      {/* Phase rows */}
      {phases.length > 0 && (
        <div className="border-t border-slate-100 px-3.5 py-2.5 space-y-2">
          {phases.map((phase) => {
            const missed = !phase.earned && hasScored;
            const scoreColor = phase.earned
              ? phase.color === 'orange' ? 'text-orange-700' : phase.color === 'rose' ? 'text-rose-700' : 'text-emerald-700'
              : missed ? 'text-rose-400' : 'text-slate-700';
            const labelColor = phase.earned
              ? phase.color === 'orange' ? 'text-orange-400' : phase.color === 'rose' ? 'text-rose-400' : 'text-emerald-500'
              : 'text-slate-400';
            const ptsColor = phase.color === 'orange' ? 'text-orange-600' : phase.color === 'rose' ? 'text-rose-600' : 'text-emerald-600';

            return (
              <div key={phase.label} className="flex items-center gap-3">
                <span className={`w-9 shrink-0 text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>{phase.label}</span>
                <span className={`flex-1 font-mono text-sm font-bold tabular-nums ${scoreColor}`}>{phase.pick}</span>
                {hasScored && (
                  phase.earned
                    ? <span className={`text-[10px] font-bold ${ptsColor}`}>+{phase.pts} pts</span>
                    : <X className="h-3 w-3 shrink-0 text-rose-400" aria-hidden="true" />
                )}
              </div>
            );
          })}

          {/* Bonus badges + submission time */}
          {(bonusBadges.length > 0 || submitted) && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
              {bonusBadges.map((b) => (
                <span key={b.label} className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ${
                  b.color === 'orange' ? 'bg-orange-50 text-orange-700 ring-orange-100'
                  : b.color === 'rose' ? 'bg-rose-50 text-rose-700 ring-rose-100'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                }`}>
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  {b.label}
                </span>
              ))}
              {submitted && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {submitted}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Desktop table ────────────────────────────────────────────────────────────

function DesktopPredictionsTable({ rows, currentUser, actualResult, hasScored, showEt, showEtHt, showPen }) {

  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="w-8 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Player</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Half Time</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Time</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Closest</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Outcome</th>
            {showEtHt && <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-orange-400">{actualResult?.et_ht_home != null ? 'ET HT' : 'ET HT (pred)'}</th>}
            {showEt && <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-orange-400">{actualResult?.et_ft_home != null ? 'ET FT' : 'ET FT (pred)'}</th>}
            {showPen && <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-rose-400">{actualResult?.pen_home != null ? 'Pens' : 'Pens (pred)'}</th>}
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Placed</th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <DesktopPredictionRow
              key={row.user_id}
              row={row}
              rank={index + 1}
              currentUser={currentUser}
              actualResult={actualResult}
              hasScored={hasScored}
              showEt={showEt}
              showEtHt={showEtHt}
              showPen={showPen}
            />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function DesktopPredictionRow({ row, rank, currentUser, actualResult, hasScored, showEt, showEtHt, showPen }) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const htEarned = (row.ht_pts || 0) > 0;
  const ftEarned = (row.ft_pts || 0) > 0;
  const etEarned = (row.et_ft_pts || 0) > 0;
  const penEarned = (row.pen_exact_pts || 0) > 0;

  return (
    <tr className={`transition-colors ${isYou ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}>
      <td className={`w-8 py-3 text-xs font-bold text-slate-400 ${isYou ? 'border-l-[3px] border-l-blue-400 pl-2.5 pr-3' : 'px-3'}`}>{rank}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900">{username}</span>
          {isYou && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <PickCell
          pick={scorePair(row.ht_home, row.ht_away)}
          actual={scorePair(actualResult?.ht_home, actualResult?.ht_away)}
          earned={htEarned}
          pts={row.ht_pts}
          hasScored={hasScored}
          hasPick={row.ht_home != null}
        />
      </td>
      <td className="px-3 py-3 text-center">
        <PickCell
          pick={scorePair(row.ft_home, row.ft_away)}
          actual={scorePair(actualResult?.ft_home, actualResult?.ft_away)}
          earned={ftEarned}
          pts={row.ft_pts}
          hasScored={hasScored}
          hasPick={row.ft_home != null}
        />
      </td>
      <td className="px-3 py-3 text-center">{ptsCell(roundPoints(row.closest_pts || 0))}</td>
      <td className="px-3 py-3 text-center">{ptsCell(row.outcome_pts || 0)}</td>
      {showEtHt && (
        <td className="px-3 py-3 text-center">
          <PickCell
            pick={scorePair(row.et_ht_home, row.et_ht_away)}
            actual={scorePair(actualResult?.et_ht_home, actualResult?.et_ht_away)}
            earned={(row.et_ht_pts || 0) > 0}
            pts={row.et_ht_pts}
            hasScored={hasScored}
            hasPick={row.et_ht_home != null}
          />
        </td>
      )}
      {showEt && (
        <td className="px-3 py-3 text-center">
          <PickCell
            pick={scorePair(row.et_ft_home, row.et_ft_away)}
            actual={scorePair(actualResult?.et_ft_home, actualResult?.et_ft_away)}
            earned={etEarned}
            pts={row.et_ft_pts}
            hasScored={hasScored}
            hasPick={row.et_ft_home != null}
          />
        </td>
      )}
      {showPen && (
        <td className="px-3 py-3 text-center">
          <PickCell
            pick={scorePair(row.pen_home, row.pen_away)}
            actual={scorePair(actualResult?.pen_home, actualResult?.pen_away)}
            earned={penEarned}
            pts={row.pen_exact_pts}
            hasScored={hasScored}
            hasPick={row.pen_home != null}
          />
        </td>
      )}
      <td className="whitespace-nowrap px-4 py-3 text-right text-[10px] text-slate-400">
        {formatPlacedAt(row.submitted_at) ?? EMPTY}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-black tabular-nums ${total > 0 ? 'text-slate-950' : 'text-slate-300'}`}>
          {total > 0 ? total : EMPTY}
        </span>
      </td>
    </tr>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

// Pick cell: shows pick + ✓/× indicator + actual (if wrong) + pts earned (if scored)
function PickCell({ pick, actual, earned, pts, hasScored, hasPick }) {
  const correct = earned && hasScored;
  const incorrect = !earned && hasScored && hasPick;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center gap-1 whitespace-nowrap font-mono text-xs font-bold tabular-nums ${
        correct ? 'text-emerald-700' : incorrect ? 'text-slate-500' : hasPick ? 'text-slate-600' : 'text-slate-300'
      }`}>
        {pick ?? EMPTY}
        {correct   && <Check className="ml-0.5 h-3 w-3 shrink-0 text-emerald-500" aria-hidden="true" />}
        {incorrect && <X    className="ml-0.5 h-2.5 w-2.5 shrink-0 text-rose-400" aria-hidden="true" />}
      </span>
      {incorrect && actual && (
        <span className="whitespace-nowrap font-mono text-[9px] text-slate-400">{actual}</span>
      )}
      {correct && pts > 0 && (
        <span className="text-[9px] font-bold text-emerald-600">+{pts} pts</span>
      )}
    </div>
  );
}

function ptsCell(value) {
  if (!value || value === 0) return <span className="text-xs tabular-nums text-slate-300">{EMPTY}</span>;
  return <span className="text-xs font-bold tabular-nums text-emerald-700">+{value}</span>;
}
