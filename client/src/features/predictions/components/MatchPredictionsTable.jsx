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
            <div className="mt-1 flex items-center gap-3">
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
  const htEarned = (row.ht_pts || 0) > 0;
  const ftEarned = (row.ft_pts || 0) > 0;
  const outEarned = (row.outcome_pts || 0) > 0;
  const clsEarned = roundPoints(row.closest_pts || 0) > 0;

  return (
    <div className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{rank}</span>
          <span className="truncate font-bold text-slate-900">{username}</span>
          {isYou && (
            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
              You
            </span>
          )}
        </div>
        {total > 0 ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black tabular-nums text-emerald-700">
            +{total}
          </span>
        ) : (
          <span className="shrink-0 text-sm font-bold text-slate-300">{EMPTY}</span>
        )}
      </div>

      {row.ft_home != null && (
        <div className="border-t border-slate-100 px-3.5 py-2.5">
          <div className="grid grid-cols-2 gap-2">
            <MobileScoreCell
              label="Half Time"
              pick={scorePair(row.ht_home, row.ht_away)}
              earned={htEarned}
              hasScored={hasScored}
              points={row.ht_pts}
              hasPrediction={row.ht_home != null}
            />
            <MobileScoreCell
              label="Full Time"
              pick={scorePair(row.ft_home, row.ft_away)}
              earned={ftEarned}
              hasScored={hasScored}
              points={row.ft_pts}
              hasPrediction
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {outEarned ? (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                <Check className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                {outcomeLabel(row.ft_home, row.ft_away)} +{row.outcome_pts}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                {outcomeLabel(row.ft_home, row.ft_away)}
              </span>
            )}
            {clsEarned && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                <Check className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                Closest +{roundPoints(row.closest_pts)}
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
}

function MobileScoreCell({ label, pick, earned, hasScored, points, hasPrediction }) {
  const missed = !earned && hasScored && hasPrediction;
  const labelCls = earned && hasScored ? 'text-emerald-500' : 'text-slate-400';
  const valueCls = earned && hasScored ? 'text-emerald-700' : missed ? 'text-slate-600' : hasPrediction ? 'text-slate-700' : 'text-slate-300';

  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
      <p className={`text-[9px] font-bold uppercase tracking-widest ${labelCls}`}>{label}</p>
      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${valueCls}`}>
        {pick ?? EMPTY}
      </p>
      {hasScored && earned && (
        <p className="mt-1 text-[10px] font-bold text-emerald-600">+{points} pts</p>
      )}
    </div>
  );
}

// ─── Desktop table ────────────────────────────────────────────────────────────

function DesktopPredictionsTable({ rows, currentUser, actualResult, hasScored }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="w-8 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Player</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Half Time</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Time</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Closest</th>
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Outcome</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DesktopPredictionRow({ row, rank, currentUser, actualResult, hasScored }) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const htEarned = (row.ht_pts || 0) > 0;
  const ftEarned = (row.ft_pts || 0) > 0;

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
