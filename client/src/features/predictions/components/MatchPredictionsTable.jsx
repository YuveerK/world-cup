import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Clock, Info } from 'lucide-react';
import { displayStatus, hasMatchScore, isHalfTime } from '@/features/matches/utils/matchStatus';
import { FIFA_PERIODS } from '@/features/matches/utils/fifaPeriods';
import { formatPlacedAt } from '../utils/predictionTiming';
import { SCORING } from '../utils/pointsBreakdown';
import { PointsLedger, ScoreToken } from './ScoreBreakdown';
import {
  getPredictionRowTotal,
  getPredictionUsername,
  getSubmissionStats,
  hasScoredPredictionRows,
  scorePair,
  sortPredictionRowsByPoints,
} from '../utils/predictionRows';

const EMPTY = '\u2014';

export function MatchPredictionsTable({ match, rows = [], currentUser, actualResult }) {
  const sorted = useMemo(() => sortPredictionRowsByPoints(rows), [rows]);
  const submissionStats = useMemo(() => getLeaderboardStats(rows), [rows]);
  const hasScored = hasScoredPredictionRows(rows);
  const context = useMemo(
    () => getMatchContext(match, actualResult, hasScored),
    [match, actualResult, hasScored],
  );
  const showExtra = useMemo(
    () => sorted.some((row) => getExtraPicks(row, context).length > 0),
    [sorted, context],
  );

  // Breakdown ledgers only make sense once the match has been scored.
  const canExpand = hasScored && Boolean(actualResult);
  const [expandedOverride, setExpandedOverride] = useState();
  const autoExpandId =
    canExpand && sorted.some((row) => String(row.user_id) === String(currentUser?.id))
      ? String(currentUser.id)
      : null;
  const expandedId = expandedOverride === undefined ? autoExpandId : expandedOverride;
  const toggleExpanded = (userId) =>
    setExpandedOverride(expandedId === String(userId) ? null : String(userId));

  return (
    <div className="space-y-3">
      <PredictionLeaderboardHeader rows={rows} submissionStats={submissionStats} />
      <MobilePredictionCards
        rows={sorted}
        currentUser={currentUser}
        context={context}
        submissionStats={submissionStats}
        match={match}
        canExpand={canExpand}
        expandedId={expandedId}
        onToggle={toggleExpanded}
      />
      <DesktopPredictionsTable
        rows={sorted}
        currentUser={currentUser}
        context={context}
        submissionStats={submissionStats}
        showExtra={showExtra}
        match={match}
        canExpand={canExpand}
        expandedId={expandedId}
        onToggle={toggleExpanded}
      />
    </div>
  );
}

function getLeaderboardStats(rows) {
  const base = getSubmissionStats(rows);
  if (!base) return null;

  const submitted = rows
    .filter((row) => row.submitted_at)
    .map((row) => ({ row, time: new Date(row.submitted_at).getTime() }))
    .filter((item) => Number.isFinite(item.time));

  const earliest = submitted.reduce((best, item) => (item.time < best.time ? item : best), submitted[0]);
  const latest = submitted.reduce((best, item) => (item.time > best.time ? item : best), submitted[0]);

  return {
    ...base,
    earliestRow: earliest?.row ?? null,
    latestRow: latest?.row ?? null,
  };
}

function PredictionLeaderboardHeader({ rows, submissionStats }) {
  const [showRules, setShowRules] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-base font-black text-slate-950">Prediction leaderboard</p>
            <button
              type="button"
              onClick={() => setShowRules((value) => !value)}
              aria-expanded={showRules}
              className={`grid h-5 w-5 place-items-center rounded-full transition ${
                showRules ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-slate-500'
              }`}
              aria-label="How scoring works"
              title="How scoring works"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-0.5 hidden text-xs font-medium text-slate-500 sm:block">
            {rows.length} {rows.length === 1 ? 'player' : 'players'} submitted
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:hidden">
            {rows.length} {rows.length === 1 ? 'player' : 'players'}
            {submissionStats && (
              <>
                {' · '}
                <span className="text-slate-400">first</span>{' '}
                {getPredictionUsername(submissionStats.earliestRow)} {formatTimeOnly(submissionStats.earliest) ?? EMPTY}
                {' · '}
                <span className="text-slate-400">last</span>{' '}
                {getPredictionUsername(submissionStats.latestRow)} {formatTimeOnly(submissionStats.latest) ?? EMPTY}
              </>
            )}
          </p>
        </div>
        {submissionStats && (
          <div className="hidden flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 sm:flex">
            <StatLine
              label="Earliest"
              value={`${getPredictionUsername(submissionStats.earliestRow)} · ${formatPlacedAt(submissionStats.earliest) ?? EMPTY}`}
            />
            <StatLine
              label="Latest"
              value={`${getPredictionUsername(submissionStats.latestRow)} · ${formatPlacedAt(submissionStats.latest) ?? EMPTY}`}
            />
            <StatLine label="Avg" value={formatPlacedAt(submissionStats.avg) ?? EMPTY} />
          </div>
        )}
      </div>
      {showRules && <ScoringRulesPanel />}
    </section>
  );
}

function ScoringRulesPanel() {
  const groups = [
    {
      title: '90 minutes',
      rules: [
        ['Exact half-time score', `+${SCORING.HT_EXACT}`],
        ['Exact full-time score', `+${SCORING.FT_EXACT}`],
        ['Correct outcome', `+${SCORING.OUTCOME}`],
        ['Closest final score', `${SCORING.CLOSEST_POOL} pts shared`],
      ],
    },
    {
      title: 'Extra time',
      rules: [
        ['Exact ET half-time', `+${SCORING.ET_HT_EXACT}`],
        ['Exact ET score', `+${SCORING.ET_FT_EXACT}`],
        ['Correct ET outcome', `+${SCORING.ET_OUTCOME}`],
        ['Closest ET score', `${SCORING.ET_CLOSEST_POOL} pts shared`],
      ],
    },
    {
      title: 'Penalties',
      rules: [
        ['Exact shoot-out score', `+${SCORING.PEN_EXACT}`],
        ['Correct winner', `+${SCORING.PEN_WINNER}`],
        ['Closest shoot-out score', `${SCORING.PEN_CLOSEST_POOL} pts shared`],
      ],
    },
  ];

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <div className="grid gap-3 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{group.title}</p>
            <div className="mt-1 space-y-0.5">
              {group.rules.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="shrink-0 font-bold tabular-nums text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-t border-slate-200/70 pt-2 text-[11px] font-medium text-slate-500">
        Shared bonuses are split evenly between everyone tied for closest — e.g. a 3-way tie on the{' '}
        {SCORING.ET_CLOSEST_POOL}-pt ET pool pays +1.3 each.
      </p>
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold text-slate-400">{label}</span>{' '}
      <span className="font-semibold text-slate-700">{value}</span>
    </span>
  );
}

function getMatchContext(match, actualResult, hasScored) {
  const status = displayStatus(match);
  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED' || Boolean(actualResult);
  const period = Number(match?.period);
  const isInEt = [
    FIFA_PERIODS.ET_FIRST_HALF,
    FIFA_PERIODS.ET_HT,
    FIFA_PERIODS.ET_SECOND_HALF,
  ].includes(period);
  const isInPens = period === FIFA_PERIODS.PENALTIES || (isLive && match?.score?.homePenalty != null);
  const isAfterRegularTime = [
    FIFA_PERIODS.PRE_ET_INTERVAL,
    FIFA_PERIODS.ET_FIRST_HALF,
    FIFA_PERIODS.ET_HT,
    FIFA_PERIODS.ET_SECOND_HALF,
    FIFA_PERIODS.PENALTIES,
    FIFA_PERIODS.MATCH_OVER,
  ].includes(period);
  const currentHome = hasMatchScore(match) ? Number(match.score.home) : null;
  const currentAway = hasMatchScore(match) ? Number(match.score.away) : null;

  return {
    actualResult,
    currentHome,
    currentAway,
    hasScored,
    isAfterRegularTime,
    isAtHalfTime: isHalfTime(match),
    isFinished,
    isInEt,
    isInPens,
    isLive,
    status,
  };
}

// Mobile cards

function MobilePredictionCards({ rows, currentUser, context, submissionStats, match, canExpand, expandedId, onToggle }) {
  return (
    <div className="space-y-2 sm:hidden">
      {rows.map((row, index) => (
        <MobilePredictionCard
          key={row.user_id}
          row={row}
          rank={index + 1}
          currentUser={currentUser}
          context={context}
          submissionStats={submissionStats}
          match={match}
          canExpand={canExpand}
          expanded={canExpand && String(row.user_id) === expandedId}
          onToggle={() => onToggle(row.user_id)}
        />
      ))}
    </div>
  );
}

function MobilePredictionCard({ row, rank, currentUser, context, submissionStats, match, canExpand, expanded, onToggle }) {
  const model = buildRowModel(row, rank, currentUser, context, submissionStats);
  const HeaderTag = canExpand ? 'button' : 'div';
  // Tokens carry their own phase labels, so they share one wrapping strip.
  const picks = [...model.picks90, ...model.extraPicks];

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-shadow ${
        model.isYou ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white'
      } ${expanded ? 'shadow-md' : ''}`}
    >
      <HeaderTag
        type={canExpand ? 'button' : undefined}
        onClick={canExpand ? onToggle : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="block min-w-0">
          <span className="flex min-w-0 items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{rank}</span>
            <span className="truncate font-bold text-slate-900">{model.username}</span>
            {model.isYou && <Badge tone="blue">You</Badge>}
            {model.isLatest && <Badge tone="slate">Latest</Badge>}
          </span>
          {model.isYou && !expanded && (
            <span className="ml-7 mt-0.5 block text-[11px] font-semibold text-blue-700">{model.rowNote}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <TotalPill total={model.total} showZero={context.isLive} showLabel />
          {canExpand && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          )}
        </span>
      </HeaderTag>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2">
        {picks.length > 0 ? (
          picks.map((pick) => <ScoreToken key={pick.label} {...pick} />)
        ) : (
          <span className="text-xs text-slate-300">{EMPTY}</span>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2">
          <PointsLedger row={row} match={match} actualResult={context.actualResult} compact />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5">
        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
          Placed {model.submitted ?? EMPTY}
        </span>
        {expanded && (
          <span className={`text-[11px] font-black tabular-nums ${model.total > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            Total {model.total > 0 ? `+${model.total}` : '0'}
          </span>
        )}
      </div>
    </div>
  );
}

// Desktop leaderboard

function DesktopPredictionsTable({ rows, currentUser, context, submissionStats, showExtra, match, canExpand, expandedId, onToggle }) {
  const columnCount = showExtra ? 5 : 4;

  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="w-10 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">#</th>
              <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Player</th>
              <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">90' Pick</th>
              {showExtra && (
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Extra-time / pens</th>
              )}
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {context.isLive ? 'Pts' : 'Total'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const expanded = canExpand && String(row.user_id) === expandedId;
              return (
                <Fragment key={row.user_id}>
                  <DesktopPredictionRow
                    model={buildRowModel(row, index + 1, currentUser, context, submissionStats)}
                    showExtra={showExtra}
                    canExpand={canExpand}
                    expanded={expanded}
                    onToggle={() => onToggle(row.user_id)}
                  />
                  {expanded && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={columnCount} className="px-4 pb-3 pt-1">
                        <PointsLedger row={row} match={match} actualResult={context.actualResult} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesktopPredictionRow({ model, showExtra, canExpand, expanded, onToggle }) {
  return (
    <tr
      onClick={canExpand ? onToggle : undefined}
      className={`transition-colors ${model.isYou ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'} ${canExpand ? 'cursor-pointer' : ''}`}
    >
      <td className={`py-2.5 text-xs font-bold text-slate-400 ${model.isYou ? 'border-l-[3px] border-l-blue-400 pl-2.5 pr-3' : 'px-3'}`}>
        {model.rank}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-900">{model.username}</span>
          {model.isYou && <Badge tone="blue">You</Badge>}
          {model.isLatest && <Badge tone="slate">Latest</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] leading-tight">
          <span className="font-medium text-slate-400">Placed {model.submitted ?? EMPTY}</span>
          {model.isYou && <span className="font-semibold text-blue-700">· {model.rowNote}</span>}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {model.picks90.map((pick) => (
            <ScoreToken key={pick.label} {...pick} />
          ))}
        </div>
      </td>
      {showExtra && (
        <td className="px-3 py-2.5">
          {model.hasExtraPick ? (
            <div className="flex max-w-[18rem] flex-wrap gap-1.5">
              {model.extraPicks.map((pick) => (
                <ScoreToken key={pick.label} {...pick} />
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-300">{EMPTY}</span>
          )}
        </td>
      )}
      <td className="px-4 py-2.5 text-right">
        {canExpand ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            aria-expanded={expanded}
            aria-label="Show points breakdown"
            className="inline-flex items-center gap-1"
          >
            <TotalPill total={model.total} showZero={model.isLive} />
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <TotalPill total={model.total} showZero={model.isLive} />
        )}
      </td>
    </tr>
  );
}

// Row model and pick rules

function buildRowModel(row, rank, currentUser, context, submissionStats) {
  const total = getPredictionRowTotal(row);
  const isYou = String(row.user_id) === String(currentUser?.id);
  const username = getPredictionUsername(row);
  const submitted = formatPlacedAt(row.submitted_at);
  const picks90 = getMainPicks(row, context);
  const extraPicks = getExtraPicks(row, context);
  const ftPick = picks90.find((pick) => pick.label === 'FT');
  const isLatest = Boolean(
    submissionStats?.latestRow?.submitted_at &&
    row.submitted_at &&
    row.submitted_at === submissionStats.latestRow.submitted_at,
  );

  return {
    extraPicks,
    hasExtraPick: extraPicks.length > 0,
    isLatest,
    isLive: context.isLive,
    isYou,
    picks90,
    rank,
    rowNote: getRowNote(ftPick),
    submitted,
    total,
    username,
  };
}

function getMainPicks(row, context) {
  return [
    {
      label: 'HT',
      score: scorePair(row.ht_home, row.ht_away) ?? EMPTY,
      scored: row.ht_pts != null,
      pts: row.ht_pts || 0,
      live: getHtLive(row, context),
    },
    {
      label: 'FT',
      score: scorePair(row.ft_home, row.ft_away) ?? EMPTY,
      scored: row.ft_pts != null,
      pts: (row.ft_pts || 0) + (row.outcome_pts || 0) + (row.closest_pts || 0),
      live: getFtLive(row, context),
    },
  ];
}

function getHtLive(row, context) {
  if (row.ht_pts != null || row.ht_home == null) return null;
  if (context.isAtHalfTime) return { tone: 'possible', label: 'Live' };
  return null;
}

function getFtLive(row, context) {
  if (row.ft_pts != null || row.ft_home == null || row.ft_away == null) return null;
  if (
    context.isLive &&
    !context.isAfterRegularTime &&
    Number.isFinite(context.currentHome) &&
    Number.isFinite(context.currentAway)
  ) {
    if (context.currentHome > Number(row.ft_home) || context.currentAway > Number(row.ft_away)) {
      return { tone: 'idle', label: 'Out of reach' };
    }
    if (sameScore(row.ft_home, row.ft_away, context.currentHome, context.currentAway)) {
      return { tone: 'correct', label: 'On track' };
    }
    return { tone: 'possible', label: 'Possible' };
  }
  return null;
}

// A phase token folds its related bonuses into a single `+N`, so the row's tokens
// visibly add up to the total. Phases that never happened (finished match that
// didn't reach ET/pens) are dropped entirely to keep the view calm.
function getExtraPicks(row, context) {
  const finished = context.isFinished;
  const wentToEt = context.actualResult?.et_ft_home != null || context.actualResult?.et_ht_home != null;
  const wentToPens = context.actualResult?.pen_home != null;

  const picks = [];

  if (row.et_ht_home != null && (!finished || wentToEt)) {
    picks.push({
      label: 'ET HT',
      score: scorePair(row.et_ht_home, row.et_ht_away) ?? EMPTY,
      scored: row.et_ht_pts != null,
      pts: row.et_ht_pts || 0,
      live: !finished && context.isInEt && row.et_ht_pts == null ? { tone: 'possible', label: 'Live' } : null,
    });
  }

  if (row.et_ft_home != null && (!finished || wentToEt)) {
    picks.push({
      label: 'ET FT',
      score: scorePair(row.et_ft_home, row.et_ft_away) ?? EMPTY,
      scored: row.et_ft_pts != null,
      pts: (row.et_ft_pts || 0) + (row.et_outcome_pts || 0) + (row.et_closest_pts || 0),
      live: !finished && context.isInEt && row.et_ft_pts == null ? { tone: 'possible', label: 'Live' } : null,
    });
  }

  if (row.pen_home != null && (!finished || wentToPens)) {
    picks.push({
      label: 'Pens',
      score: scorePair(row.pen_home, row.pen_away) ?? EMPTY,
      scored: row.pen_exact_pts != null,
      pts: (row.pen_exact_pts || 0) + (row.pen_winner_pts || 0) + (row.pen_closest_pts || 0),
      live: !finished && context.isInPens && row.pen_exact_pts == null ? { tone: 'possible', label: 'Live' } : null,
    });
  }

  return picks;
}

function getRowNote(ftPick) {
  if (!ftPick || ftPick.score === EMPTY) return 'Prediction submitted';
  if (ftPick.scored) return ftPick.pts > 0 ? 'Your FT pick scored' : 'Your FT pick missed';
  if (ftPick.live?.label === 'On track') return 'Your FT pick is on track';
  if (ftPick.live?.label === 'Possible') return 'Your FT pick is still alive';
  if (ftPick.live?.label === 'Out of reach') return 'Your FT pick is out of reach';
  return 'Prediction submitted';
}

function sameScore(aHome, aAway, bHome, bAway) {
  return Number(aHome) === Number(bHome) && Number(aAway) === Number(bAway);
}

function formatTimeOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

// Small display atoms

function Badge({ tone, children }) {
  const cls = tone === 'blue'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-slate-100 text-slate-500';
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

function TotalPill({ total, showZero = false, showLabel = false }) {
  return total > 0 ? (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black tabular-nums text-emerald-700">
      +{total}{showLabel ? ' pts' : ''}
    </span>
  ) : showZero ? (
    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black tabular-nums text-slate-600">
      0{showLabel ? ' pts' : ''}
    </span>
  ) : showLabel ? (
    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-300">{EMPTY} pts</span>
  ) : (
    <span className="shrink-0 text-sm font-bold text-slate-300">{EMPTY}</span>
  );
}
