import { Activity, Check, ChevronDown, Crown, Medal, RefreshCw, Target, Trophy } from 'lucide-react';
import { Podium } from '@/components/ui/Podium';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { dayKeyOf, formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { canShowMatchDetails, displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';


function groupMatchesByDay(matchPoints, fixturesById) {
  const map = new Map();
  for (const entry of matchPoints) {
    const match = fixturesById.get(String(entry.match_id));
    const key = match?.date ? dayKeyOf(match.date) : 'tbc';
    if (!map.has(key)) {
      map.set(key, { key, date: match?.date ? new Date(match.date) : null, items: [] });
    }
    map.get(key).items.push({ entry, match });
  }
  const groups = [...map.values()].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  groups.forEach((g) =>
    g.items.sort((a, b) => new Date(a.match?.date || 0) - new Date(b.match?.date || 0))
  );
  return groups;
}

export function LeaderboardPage({ leaderboard, fixturesById, currentUser, loading, refreshAll, onViewStats }) {
  const leader = leaderboard[0];
  const scoredPredictions = leaderboard.reduce(
    (sum, row) => sum + (row.match_points || []).filter((e) => e.scored).length,
    0
  );

  if (loading) return <LoadingPanel label="Loading leaderboard" />;
  if (!leaderboard.length)
    return <EmptyState title="No leaderboard yet" detail="Players will appear after accounts and predictions are created." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Leaderboard</h2>
          </div>
          <p className="text-sm text-slate-500">
            Ranked by total points. Expand any player to see their match-by-match breakdown.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Crown} tint="amber" label="Leader" value={leader?.username || '-'} />
        <StatTile icon={Medal} tint="blue" label="Players" value={leaderboard.length} />
        <StatTile icon={Target} tint="sky" label="Scored predictions" value={scoredPredictions} />
      </div>

      {/* Podium */}
      <Podium rows={leaderboard} currentUser={currentUser} />

      {/* Full ranking */}
      <div className="space-y-2">
        {leaderboard.map((row) => (
          <PlayerRow
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

function PlayerRow({ row, fixturesById, currentUser, onViewStats }) {
  const isCurrentUser = row.username === currentUser?.username;
  const rankBadge =
    row.rank === 1 ? 'bg-amber-100 text-amber-700' :
    row.rank === 2 ? 'bg-slate-200 text-slate-600' :
    row.rank === 3 ? 'bg-orange-100 text-orange-600' :
    'bg-slate-100 text-slate-500';

  const dayGroups = groupMatchesByDay(row.match_points || [], fixturesById);

  return (
    <details
      name="lb-players"
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
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                You
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {row.predictions_count || 0} predictions · Winner:{' '}
            <span className="font-medium text-slate-700">{row.winner || 'Not set'}</span>
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

      <div className="border-t border-slate-200 px-4 py-4">
        {/* Category breakdown */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <CategoryStat label="HT Exact" points={row.ht_pts} />
          <CategoryStat label="FT Exact" points={row.ft_pts} />
          <CategoryStat label="Closest" points={row.closest_pts} />
          <CategoryStat label="Outcome" points={row.outcome_pts} />
          <CategoryStat label="Winner" points={row.winner_pts} highlight />
        </div>

        {/* Matches grouped by match day — collapsed by default */}
        {dayGroups.length ? (
          <div className="space-y-2">
            {dayGroups.map((group) => {
              const dayTotal = roundPoints(
                group.items.reduce((s, { entry }) => s + (entry.match_total || 0), 0)
              );
              const hasPoints = dayTotal > 0;
              return (
                <details key={group.key} name={`lb-days-${row.username}`} className="group/day overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {group.date ? formatDayHeading(group.date) : 'Date TBC'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black tabular-nums ${
                          hasPoints ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {hasPoints ? `+${dayTotal}` : '0'} pts
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 group-open/day:rotate-180" aria-hidden="true" />
                      </div>
                    </div>
                  </summary>
                  <div className="space-y-1.5 border-t border-slate-200 p-2">
                    {group.items.map(({ entry, match }) => (
                      <MatchRow
                        key={entry.match_id}
                        entry={entry}
                        match={match}
                        onViewStats={onViewStats}
                      />
                    ))}
                  </div>
                </details>
              );
            })}
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
    <div
      className={`rounded-lg border px-3 py-2 text-center ${
        highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>
        {roundPoints(points)}
      </p>
    </div>
  );
}

function MatchFlag({ team }) {
  if (!team?.flagUrl) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-400">
        {team?.abbreviation || '--'}
      </span>
    );
  }
  return (
    <img
      src={team.flagUrl}
      alt=""
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm"
    />
  );
}

function MatchRow({ entry, match, onViewStats }) {
  const total = roundPoints(entry.match_total);
  const status = displayStatus(match || {}) || (entry.scored ? 'FINISHED' : 'UPCOMING');
  const live = status === 'LIVE';
  const prediction = entry.prediction;

  const htPick = prediction?.ht_home != null ? `${prediction.ht_home}–${prediction.ht_away}` : '—';
  const ftPick = prediction?.ft_home != null ? `${prediction.ft_home}–${prediction.ft_away}` : '—';
  const htResult = entry.result?.ht_home != null ? `${entry.result.ht_home}–${entry.result.ht_away}` : '—';
  const ftResult = entry.result?.ft_home != null
    ? `${entry.result.ft_home}–${entry.result.ft_away}`
    : (hasMatchScore(match) ? scoreText(match) : '—');

  const catPills = [
    { label: 'HT', pts: entry.ht_pts, cls: 'border-amber-100 bg-amber-50 text-amber-700' },
    { label: 'FT', pts: entry.ft_pts, cls: 'border-blue-100 bg-blue-50 text-blue-700' },
    { label: 'Closest', pts: entry.closest_pts, cls: 'border-violet-100 bg-violet-50 text-violet-700' },
    { label: 'Outcome', pts: entry.outcome_pts, cls: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  ].filter(({ pts: p }) => roundPoints(p || 0) > 0);

  return (
    <details className="group/match overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none px-4 pb-3 pt-4">
        {/* Three-column: Home | Score | Away — names sit below their flag */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <MatchFlag team={match?.home} />
            <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
              {teamName(match?.home) || matchTitle(match, entry.match_id)}
            </p>
          </div>

          <div className="shrink-0 px-4 text-center">
            {hasMatchScore(match) ? (
              <p className="whitespace-nowrap text-3xl font-black tabular-nums leading-none text-slate-950">
                {scoreText(match)}
              </p>
            ) : (
              <p className="whitespace-nowrap text-xl font-black uppercase leading-none text-slate-400">VS</p>
            )}
            {live ? (
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </span>
            ) : (
              <p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${
                status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'
              }`}>
                {status}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <MatchFlag team={match?.away} />
            <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
              {teamName(match?.away) || ''}
            </p>
          </div>
        </div>

        {/* Footer: category pills (left) + pts + chevron (right) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {catPills.map(({ label, pts: p, cls }) => (
              <span key={label} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
                {label} +{roundPoints(p)}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
              total > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {total} pts
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/match:rotate-180"
              aria-hidden="true"
            />
          </div>
        </div>
      </summary>

      {/* Expanded: premium scoring breakdown */}
      <div className="border-t border-slate-100">
        {/* Score comparison — light card */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Pick</p>
              <div className="space-y-2">
                {[{ label: 'HT', val: htPick }, { label: 'FT', val: ftPick }].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-black tabular-nums text-slate-800 ring-1 ring-slate-200">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</p>
              <div className="space-y-2">
                {[
                  { label: 'HT', val: htResult, correct: roundPoints(entry.ht_pts) > 0 },
                  { label: 'FT', val: ftResult, correct: roundPoints(entry.ft_pts) > 0 },
                ].map(({ label, val, correct }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                    <span className={`rounded-lg px-2.5 py-1 text-sm font-black tabular-nums ring-1 ${
                      correct
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-white text-slate-400 ring-slate-200'
                    }`}>
                      {val}
                    </span>
                    {correct && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scoring tiles — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2 p-4">
          {[
            { label: 'Half Time', sub: '5 pts', pts: entry.ht_pts },
            { label: 'Full Time', sub: '10 pts', pts: entry.ft_pts },
            { label: 'Closest Score', sub: '6 pts shared', pts: entry.closest_pts },
            { label: 'Win / Draw', sub: '4 pts', pts: entry.outcome_pts },
          ].map(({ label, sub, pts }) => {
            const earned = roundPoints(pts) > 0;
            return (
              <div
                key={label}
                className={`rounded-xl p-3.5 transition-all ${
                  earned
                    ? 'bg-blue-600 shadow-[0_4px_20px_-6px_rgba(37,99,235,0.55)]'
                    : 'border border-slate-100 bg-slate-50'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wide ${earned ? 'text-blue-200' : 'text-slate-400'}`}>
                  {label}
                </p>
                <p className={`mt-1.5 text-2xl font-black tabular-nums leading-none ${earned ? 'text-white' : 'text-slate-300'}`}>
                  +{roundPoints(pts)}
                </p>
                <p className={`mt-1 text-[10px] font-medium ${earned ? 'text-blue-300' : 'text-slate-300'}`}>
                  {sub}
                </p>
              </div>
            );
          })}
        </div>

        {match && canShowMatchDetails(match) && (
          <div className="border-t border-slate-100 px-4 pb-4">
            <button className="btn btn-secondary w-full justify-center" onClick={() => onViewStats(match)}>
              <Activity className="h-4 w-4" aria-hidden="true" />
              Match details
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

