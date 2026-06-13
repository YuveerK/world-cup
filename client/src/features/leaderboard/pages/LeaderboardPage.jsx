import { Activity, ChevronDown, Crown, Medal, RefreshCw, Target, Trophy } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { formatDate } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { canShowMatchDetails, displayStatus } from '@/features/matches/utils/matchStatus';
import { matchTitle } from '@/features/matches/utils/matchFormatters';
import {
  predictionOutcome,
  predictionText,
  resultOutcome,
  resultText,
  scoreDistance,
} from '@/features/predictions/utils/predictionDisplay';
import {
  halfTimeDetail,
  fullTimeDetail,
  closestDetail,
  outcomeDetail,
} from '@/features/summaries/utils/summaryFormatters';

const PODIUM_STYLES = {
  1: {
    ring: 'ring-amber-400',
    avatar: 'from-amber-300 to-yellow-500 text-blue-950',
    block: 'from-amber-400/90 to-yellow-500/80 h-28',
    accent: 'text-amber-500',
    label: 'Champion',
  },
  2: {
    ring: 'ring-slate-300',
    avatar: 'from-slate-200 to-slate-400 text-slate-800',
    block: 'from-slate-300/80 to-slate-400/60 h-20',
    accent: 'text-slate-500',
    label: 'Runner-up',
  },
  3: {
    ring: 'ring-orange-300',
    avatar: 'from-orange-300 to-amber-600 text-blue-950',
    block: 'from-orange-400/80 to-amber-600/60 h-16',
    accent: 'text-orange-500',
    label: 'Third',
  },
};

function getInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeaderboardPage({ leaderboard, fixturesById, currentUser, loading, refreshAll, onViewStats }) {
  const leader = leaderboard[0];
  const scoredPredictions = leaderboard.reduce((sum, row) => {
    return sum + (row.match_points || []).filter((entry) => entry.scored).length;
  }, 0);

  if (loading) return <LoadingPanel label="Loading leaderboard" />;
  if (!leaderboard.length) return <EmptyState title="No leaderboard yet" detail="Players will appear after accounts and predictions are created." />;

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Leaderboard</h2>
          </div>
          <p className="text-sm text-slate-500">
            Ranked by total points. Tap any player to see how every match was scored.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Stadium podium for the top three */}
      <div className="panel px-4 py-7 sm:px-8">
        <div className="flex items-end justify-center gap-2 sm:gap-5">
          {podiumOrder.map((row) => (
            <PodiumCard
              key={row.id || row.username}
              row={row}
              isCurrentUser={row.username === currentUser?.username}
            />
          ))}
        </div>
      </div>

      {/* Calm summary metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Crown} tint="amber" label="Leader" value={leader?.username || '-'} />
        <StatTile icon={Medal} tint="blue" label="Players" value={leaderboard.length} />
        <StatTile icon={Target} tint="sky" label="Scored predictions" value={scoredPredictions} />
      </div>

      {/* Full ranking — collapsed by default to stay readable */}
      <div className="space-y-2">
        {leaderboard.map((row) => (
          <LeaderboardDetailRow
            key={row.id || row.username}
            row={row}
            fixturesById={fixturesById}
            currentUser={currentUser}
            onViewStats={onViewStats}
          />
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ row, isCurrentUser }) {
  const style = PODIUM_STYLES[row.rank] || PODIUM_STYLES[3];
  const isChampion = row.rank === 1;

  return (
    <div className={`flex w-1/3 max-w-[180px] flex-col items-center ${isChampion ? '-mb-0' : ''}`}>
      <div className="relative mb-3 flex flex-col items-center">
        {isChampion && <Crown className="mb-1 h-5 w-5 text-amber-500" aria-hidden="true" />}
        <div
          className={`grid place-items-center rounded-full bg-gradient-to-br ${style.avatar} font-extrabold ring-2 ${style.ring} ring-offset-2 ring-offset-white ${
            isChampion ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base'
          }`}
        >
          {getInitials(row.username)}
        </div>
      </div>
      <p className="max-w-full truncate text-center text-sm font-bold text-slate-950">{row.username}</p>
      <p className={`text-center text-2xl font-black ${style.accent}`}>{row.total}</p>
      <p className="mb-2 text-center text-[11px] font-medium text-slate-400">
        {row.predictions_count || 0} picks
      </p>
      {isCurrentUser && (
        <span className="mb-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
          You
        </span>
      )}
      <div className={`flex w-full items-start justify-center rounded-t-lg bg-gradient-to-b ${style.block} pt-2`}>
        <span className="text-lg font-black text-blue-950/80">{row.rank}</span>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, tint, label, value }) {
  const tints = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="panel flex items-center gap-3 p-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function LeaderboardDetailRow({ row, fixturesById, currentUser, onViewStats }) {
  const isCurrentUser = row.username === currentUser?.username;
  const rankBadge =
    row.rank === 1 ? 'bg-amber-100 text-amber-700' :
    row.rank === 2 ? 'bg-slate-200 text-slate-600' :
    row.rank === 3 ? 'bg-orange-100 text-orange-600' :
    'bg-slate-100 text-slate-500';

  return (
    <details
      className={`group overflow-hidden rounded-xl border transition ${
        isCurrentUser ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${rankBadge}`}>
          {row.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-950">{row.username}</p>
            {isCurrentUser && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">You</span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {row.predictions_count || 0} predictions · Winner: <span className="font-medium text-slate-700">{row.winner || 'Not set'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black leading-none text-slate-950">{row.total}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">points</p>
        </div>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <CategoryStat label="HT exact" points={row.ht_pts} />
          <CategoryStat label="FT exact" points={row.ft_pts} />
          <CategoryStat label="Closest" points={row.closest_pts} />
          <CategoryStat label="Outcome" points={row.outcome_pts} />
          <CategoryStat label="Winner" points={row.winner_pts} highlight />
        </div>

        {row.match_points?.length ? (
          <div className="space-y-2">
            {row.match_points.map((entry) => (
              <MatchCalculation
                key={entry.match_id}
                entry={entry}
                match={fixturesById.get(String(entry.match_id))}
                onViewStats={onViewStats}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No match predictions yet.</p>
        )}
      </div>
    </details>
  );
}

function CategoryStat({ label, points, highlight }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>{roundPoints(points)}</p>
    </div>
  );
}

function MatchCalculation({ entry, match, onViewStats }) {
  const prediction = entry.prediction;
  const distance = scoreDistance(entry);
  const actualOutcome = resultOutcome(entry, match);
  const predictedOutcome = predictionOutcome(prediction);
  const total = roundPoints(entry.match_total);
  const status = displayStatus(match || {}) || (entry.scored ? 'SCORED' : 'PENDING');

  return (
    <details className="group/match overflow-hidden rounded-lg border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">{matchTitle(match, entry.match_id)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{status}</span>
          </div>
          {match?.date && <p className="text-[11px] text-slate-400">{formatDate(match.date)}</p>}
        </div>
        <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${total > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {total} pts
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/match:rotate-180" aria-hidden="true" />
      </summary>

      <div className="border-t border-slate-100 px-3 py-3">
        <div className="mb-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <p>Prediction: <span className="font-medium text-slate-800">{predictionText(prediction)}</span></p>
          <p>Result: <span className="font-medium text-slate-800">{resultText(entry, match)}</span></p>
        </div>

        <div className="space-y-2">
          <ScoringLine label="Half Time Score" rule="5 pts" points={entry.ht_pts} detail={halfTimeDetail(entry)} />
          <ScoringLine label="Full Time Exact Score" rule="10 pts" points={entry.ft_pts} detail={fullTimeDetail(entry)} />
          <ScoringLine label="Closest Score" rule="6 pts shared" points={entry.closest_pts} detail={closestDetail(entry, distance)} />
          <ScoringLine label="Win/Draw" rule="4 pts" points={entry.outcome_pts} detail={outcomeDetail(entry, predictedOutcome, actualOutcome)} />
        </div>

        {match && canShowMatchDetails(match) && (
          <button className="btn btn-secondary mt-3" onClick={() => onViewStats(match)}>
            <Activity className="h-4 w-4" aria-hidden="true" />
            Match details
          </button>
        )}
      </div>
    </details>
  );
}

function ScoringLine({ label, rule, points, detail }) {
  const earned = roundPoints(points) > 0;
  return (
    <div className="grid gap-1 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 md:grid-cols-[180px_90px_1fr_60px] md:items-center md:gap-2">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-[11px] font-semibold uppercase text-slate-400">{rule}</p>
      <p className="text-sm text-slate-500">{detail}</p>
      <p className={`text-left text-sm font-bold md:text-right ${earned ? 'text-blue-600' : 'text-slate-400'}`}>
        +{roundPoints(points)}
      </p>
    </div>
  );
}
