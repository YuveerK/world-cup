import { Medal } from 'lucide-react';
import { LoadingRows } from '@/components/feedback/LoadingPanel';

export function LeaderboardPanel({ leaderboard, currentUser, loading }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
            <Medal className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Leaderboard</h2>
        </div>
        <span className="text-xs font-medium text-slate-400">{leaderboard.length} players</span>
      </div>

      {loading ? (
        <LoadingRows />
      ) : leaderboard.length ? (
        <div className="grid gap-1.5">
          {leaderboard.slice(0, 10).map((row) => (
            <div
              key={row.id || row.username}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                row.username === currentUser?.username
                  ? 'bg-blue-50 ring-1 ring-blue-100'
                  : 'hover:bg-slate-50'
              }`}
            >
              <span className={`grid h-7 w-7 place-items-center rounded-md text-xs font-semibold ${
                row.rank === 1 ? 'bg-amber-100 text-amber-700' :
                row.rank === 2 ? 'bg-slate-200 text-slate-600' :
                row.rank === 3 ? 'bg-orange-100 text-orange-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {row.rank}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{row.username}</p>
                <p className="text-xs text-slate-400">{row.predictions_count || 0} predictions</p>
              </div>
              <span className="text-sm font-semibold text-slate-800">{row.total}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No entries yet.</p>
      )}
    </div>
  );
}
