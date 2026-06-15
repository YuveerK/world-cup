import { RefreshCw, Trophy } from 'lucide-react';

export function LeaderboardPageHeader({ onRefresh }) {
  return (
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
      <button className="btn btn-secondary" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}
