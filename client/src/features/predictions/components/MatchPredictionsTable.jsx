import { useMemo } from 'react';
import { Check, Clock } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { outcomeLabel } from '@/features/matches/utils/matchFormatters';
import { timeBeforeKickoff } from '../utils/predictionTiming';
import {
  getPredictionRowTotal,
  getPredictionUsername,
  getSubmissionStats,
  hasScoredPredictionRows,
  scorePair,
  sortPredictionRowsByPoints,
} from '../utils/predictionRows';

const EMPTY_SCORE = '\u2014';

export function MatchPredictionsTable({ rows = [], currentUser, matchDate, actualResult }) {
  const sorted = useMemo(() => sortPredictionRowsByPoints(rows), [rows]);
  const submissionStats = useMemo(() => getSubmissionStats(rows), [rows]);
  const hasScored = hasScoredPredictionRows(rows);

  return (
    <div className="space-y-3">
      {actualResult && <ActualResultBanner actualResult={actualResult} />}
      {submissionStats && <SubmissionStats stats={submissionStats} matchDate={matchDate} />}
      <MobilePredictionCards
        rows={sorted}
        currentUser={currentUser}
        matchDate={matchDate}
        actualResult={actualResult}
        hasScored={hasScored}
      />
      <DesktopPredictionsTable
        rows={sorted}
        currentUser={currentUser}
        matchDate={matchDate}
        actualResult={actualResult}
        hasScored={hasScored}
      />
    </div>
  );
}

function ActualResultBanner({ actualResult }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Match result</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {actualResult.ht_home != null && (
            <span className="text-sm font-black tabular-nums text-emerald-900">
              HT {scorePair(actualResult.ht_home, actualResult.ht_away)}
            </span>
          )}
          <span className="text-xs text-emerald-400">&middot;</span>
          <span className="text-sm font-black tabular-nums text-emerald-900">
            FT {scorePair(actualResult.ft_home, actualResult.ft_away)}
          </span>
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            {outcomeLabel(actualResult.ft_home, actualResult.ft_away)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SubmissionStats({ stats, matchDate }) {
  const items = [
    { label: 'Earliest', value: timeBeforeKickoff(stats.earliest, matchDate) },
    { label: 'Latest', value: timeBeforeKickoff(stats.latest, matchDate) },
    { label: 'Average', value: timeBeforeKickoff(stats.avg, matchDate) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
      {items.map(({ label, value }) => (
        <div key={label} className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-900">{value ?? '-'}</p>
        </div>
      ))}
    </div>
  );
}

function MobilePredictionCards({ rows, currentUser, matchDate, actualResult, hasScored }) {
  return (
    <div className="space-y-2 sm:hidden">
      {rows.map((row, index) => (
        <MobilePredictionCard
          key={row.user_id}
          row={row}
          rank={index + 1}
          currentUser={currentUser}
          matchDate={matchDate}
          actualResult={actualResult}
          hasScored={hasScored}
        />
      ))}
    </div>
  );
}

function MobilePredictionCard({ row, rank, currentUser, matchDate, actualResult, hasScored }) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const submitted = timeBeforeKickoff(row.submitted_at, matchDate);
  const htEarned = (row.ht_pts || 0) > 0;
  const ftEarned = (row.ft_pts || 0) > 0;
  const outEarned = (row.outcome_pts || 0) > 0;
  const clsEarned = roundPoints(row.closest_pts || 0) > 0;
  const htActual = scorePair(actualResult?.ht_home, actualResult?.ht_away);
  const ftActual = scorePair(actualResult?.ft_home, actualResult?.ft_away);

  return (
    <div className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
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
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${total > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
          {total} pts
        </span>
      </div>

      {row.ft_home != null && (
        <div className="border-t border-slate-100 px-3.5 py-2.5">
          <div className="grid grid-cols-2 gap-2">
            <MobileScoreCard
              label="Half time"
              value={scorePair(row.ht_home, row.ht_away) ?? EMPTY_SCORE}
              earned={htEarned}
              hasScored={hasScored}
              actual={htActual}
              points={row.ht_pts}
              hasPrediction={row.ht_home != null}
            />
            <MobileScoreCard
              label="Full time"
              value={scorePair(row.ft_home, row.ft_away)}
              earned={ftEarned}
              hasScored={hasScored}
              actual={ftActual}
              points={row.ft_pts}
              hasPrediction
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {hasScored ? (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${outEarned ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                {outEarned && <Check className="mr-0.5 inline h-3 w-3" aria-hidden="true" />}
                {outcomeLabel(row.ft_home, row.ft_away)} {outEarned ? `+${row.outcome_pts}` : '0'}
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
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

function MobileScoreCard({ label, value, earned, hasScored, actual, points, hasPrediction }) {
  const missed = !earned && hasScored && hasPrediction;

  return (
    <div className={`rounded-lg px-2.5 py-2 ${getMobileScoreCardClass(earned, missed, hasScored)}`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest ${getMobileScoreLabelClass(earned, missed, hasScored)}`}>
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${getMobileScoreValueClass(earned, missed, hasScored, hasPrediction)}`}>
        {value}
      </p>
      {missed && actual && <p className="mt-0.5 text-[9px] text-slate-400">actual {actual}</p>}
      {hasScored && (
        <p className={`mt-1 text-[10px] font-bold ${earned ? 'text-emerald-600' : 'text-slate-400'}`}>
          {earned ? `+${points} pts` : '0 pts'}
        </p>
      )}
    </div>
  );
}

function DesktopPredictionsTable({ rows, currentUser, matchDate, actualResult, hasScored }) {
  return (
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
                  <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {scorePair(actualResult.ht_home, actualResult.ht_away)}</span>
                )}
              </th>
              <th className="px-3 py-2.5 text-center">
                FT pick
                {actualResult?.ft_home != null && (
                  <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {scorePair(actualResult.ft_home, actualResult.ft_away)}</span>
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
            {rows.map((row, index) => (
              <DesktopPredictionRow
                key={row.user_id}
                row={row}
                rank={index + 1}
                currentUser={currentUser}
                matchDate={matchDate}
                actualResult={actualResult}
                hasScored={hasScored}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesktopPredictionRow({ row, rank, currentUser, matchDate, actualResult, hasScored }) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const htEarned = (row.ht_pts || 0) > 0;
  const ftEarned = (row.ft_pts || 0) > 0;

  return (
    <tr className={isYou ? 'bg-blue-50' : 'hover:bg-slate-50'}>
      <td className="w-8 px-3 py-2.5 text-xs font-bold text-slate-400">{rank}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900">{username}</span>
          {isYou && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
              You
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center text-xs">
        <ScorePick
          pick={scorePair(row.ht_home, row.ht_away)}
          actual={scorePair(actualResult?.ht_home, actualResult?.ht_away)}
          earned={htEarned}
          hasPoints={hasScored}
        />
      </td>
      <td className="px-3 py-2.5 text-center text-xs">
        <ScorePick
          pick={scorePair(row.ft_home, row.ft_away)}
          actual={scorePair(actualResult?.ft_home, actualResult?.ft_away)}
          earned={ftEarned}
          hasPoints={hasScored}
        />
      </td>
      <td className="px-3 py-2.5 text-center text-xs tabular-nums">{pointsCell(row.ht_pts || 0)}</td>
      <td className="px-3 py-2.5 text-center text-xs tabular-nums">{pointsCell(row.ft_pts || 0)}</td>
      <td className="px-3 py-2.5 text-center text-xs tabular-nums">{pointsCell(roundPoints(row.closest_pts || 0))}</td>
      <td className="px-3 py-2.5 text-center text-xs tabular-nums">{pointsCell(row.outcome_pts || 0)}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-center text-[11px] text-slate-500">
        {timeBeforeKickoff(row.submitted_at, matchDate) ?? '-'}
      </td>
      <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{total}</td>
    </tr>
  );
}

function ScorePick({ pick, actual, earned, hasPoints }) {
  const correct = earned && hasPoints;
  const incorrect = !earned && hasPoints && pick != null;

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${getScorePickClass(correct, incorrect, pick)}`}>
      {pick != null ? pick : EMPTY_SCORE}
      {correct && <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />}
      {incorrect && actual != null && <span className="text-[10px] font-normal text-slate-400">({actual})</span>}
    </span>
  );
}

function pointsCell(value) {
  return <span className={value > 0 ? 'font-bold text-emerald-700' : 'text-slate-400'}>{value}</span>;
}

function getScorePickClass(correct, incorrect, pick) {
  if (correct) return 'text-emerald-700';
  if (incorrect) return 'text-rose-500';
  return pick != null ? 'text-slate-600' : 'text-slate-300';
}

function getMobileScoreCardClass(earned, missed, hasScored) {
  if (earned && hasScored) return 'bg-emerald-50 ring-1 ring-emerald-100';
  if (missed) return 'bg-rose-50 ring-1 ring-rose-100';
  return 'bg-slate-50 ring-1 ring-slate-100';
}

function getMobileScoreLabelClass(earned, missed, hasScored) {
  if (earned && hasScored) return 'text-emerald-500';
  if (missed) return 'text-rose-400';
  return 'text-slate-400';
}

function getMobileScoreValueClass(earned, missed, hasScored, hasPrediction) {
  if (earned && hasScored) return 'text-emerald-700';
  if (missed) return 'text-rose-600';
  return hasPrediction ? 'text-slate-700' : 'text-slate-300';
}
