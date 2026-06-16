import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { computeMatchDayHistory } from '../utils/leaderboardMatchDayHistory';

function getChipStyle(pts) {
  if (!pts || pts <= 0) return {
    wrap: 'border-gray-200 bg-gray-50',
    label: 'text-gray-400',
    pts: 'text-gray-500',
    rank: 'text-gray-400',
  };
  if (pts >= 20) return {
    wrap: 'border-emerald-200 bg-emerald-50',
    label: 'text-emerald-500',
    pts: 'text-emerald-700',
    rank: 'text-emerald-600',
  };
  return {
    wrap: 'border-blue-100 bg-blue-50',
    label: 'text-blue-400',
    pts: 'text-blue-700',
    rank: 'text-blue-500',
  };
}

export function MatchDayHistoryStrip({ row, leaderboard, fixturesById }) {
  const history = useMemo(
    () => computeMatchDayHistory(row, leaderboard, fixturesById),
    [row, leaderboard, fixturesById],
  );

  if (!history.length) return null;

  return (
    <div className="mb-5">
      <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        Match Day History
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {history.map((day, i) => {
          const c = getChipStyle(day.dayPts);
          return (
            <div
              key={day.key}
              className={`animate-fade-slide-in flex h-[4.5rem] w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border ${c.wrap}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <p className={`text-[9px] font-bold uppercase tracking-wider ${c.label}`}>Day {day.dayIndex}</p>
              <p className={`tabular-nums text-base font-black leading-none ${c.pts}`}>+{day.dayPts}</p>
              <p className={`text-[9px] font-semibold ${c.rank}`}>Rank #{day.rank}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
