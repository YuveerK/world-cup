import { Award, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { formatDate } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { displayStatus } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { summaryPlayerKey } from '@/features/predictions/utils/predictionDisplay';
import { buildSummaryEntry } from '../utils/summaryFormatters';
import { PlayerShareCard } from '../components/PlayerShareCard';

export function SummaryPage({
  leaderboard,
  fixtures,
  fixturesById,
  currentUser,
  loading,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedMatchId,
  setSelectedMatchId,
  refreshAll,
}) {
  const selectedPlayer = leaderboard.find((row) => summaryPlayerKey(row) === selectedPlayerId)
    || leaderboard.find((row) => row.username === currentUser?.username)
    || leaderboard[0];
  const sortedFixtures = [...fixtures].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const selectedMatch = fixturesById.get(String(selectedMatchId)) || sortedFixtures[0] || null;
  const summaryEntry = buildSummaryEntry(selectedPlayer, selectedMatch?.id || selectedMatchId, selectedMatch);

  if (loading) return <LoadingPanel label="Loading summaries" />;
  if (!leaderboard.length) return <EmptyState title="No player summaries yet" detail="Players will appear after accounts and predictions are created." />;

  return (
    <div className="space-y-6">
      {/* Hero header — matches the report programme pattern */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-5 py-6 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 right-10 top-8 h-px bg-blue-500/15" />
          <div className="absolute bottom-8 left-10 right-10 h-px bg-blue-500/15" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
        </div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 ring-1 ring-amber-200">
                <Award className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Player summaries</h2>
            </div>
            <p className="text-sm text-slate-600">
              Match performance cards — points, rank, prediction, result, and scoring detail.
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Player</span>
            <select className="field" value={summaryPlayerKey(selectedPlayer)} onChange={(e) => setSelectedPlayerId(e.target.value)}>
              {leaderboard.map((row) => (
                <option key={summaryPlayerKey(row)} value={summaryPlayerKey(row)}>
                  #{row.rank} {row.username} · {roundPoints(row.total)} pts
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Match</span>
            <select className="field" value={selectedMatch ? String(selectedMatch.id) : ''} onChange={(e) => setSelectedMatchId(e.target.value)}>
              {sortedFixtures.map((match) => (
                <option key={match.id} value={match.id}>
                  {formatDate(match.date)} · {teamName(match.home)} vs {teamName(match.away)} ({displayStatus(match)})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <PlayerShareCard
        player={selectedPlayer}
        entry={summaryEntry}
        match={selectedMatch}
        currentUser={currentUser}
      />
    </div>
  );
}
