import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LEADERBOARD_CATEGORY_STATS } from '../constants';
import { groupMatchesByDay } from '../utils/leaderboardMatchGroups';
import { getRankBadgeClass, getRankProgressClass } from '../utils/leaderboardRankStyles';
import { LeaderboardCategoryStat } from './LeaderboardCategoryStat';
import { LeaderboardMatchDayGroup } from './LeaderboardMatchDayGroup';

export function LeaderboardPlayerRow({ row, fixturesById, currentUser, maxPoints, onViewStats, isOpen, onToggle }) {
  const [contentKey, setContentKey] = useState(0);
  const [openDayKey, setOpenDayKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setContentKey((k) => k + 1);
    } else {
      setOpenDayKey(null);
    }
  }, [isOpen]);

  const toggleDay = (key) => setOpenDayKey((prev) => (prev === key ? null : key));

  const isCurrentUser = row.username === currentUser?.username;
  const dayGroups = groupMatchesByDay(row.match_points || [], fixturesById);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition ${
        isCurrentUser ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <button
        type="button"
        className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${getRankBadgeClass(row.rank)}`}>
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
              {row.predictions_count || 0} predictions &middot; Winner:{' '}
              <span className="font-medium text-slate-700">{row.winner || 'Not set'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black leading-none text-slate-950">{row.total}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">points</p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>

        <div className="h-1.5 w-full bg-slate-100">
          <div
            className={`h-full transition-all duration-500 ${getRankProgressClass(row.rank)}`}
            style={{ width: `${Math.round(((row.total || 0) / maxPoints) * 100)}%` }}
          />
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-200 px-4 py-4" key={contentKey}>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {LEADERBOARD_CATEGORY_STATS.map(({ label, pointsKey, highlight }, i) => (
                <div
                  key={pointsKey}
                  className="animate-fade-slide-in"
                  style={{ animationDelay: `${30 + i * 45}ms` }}
                >
                  <LeaderboardCategoryStat label={label} points={row[pointsKey]} highlight={highlight} />
                </div>
              ))}
            </div>

            {dayGroups.length ? (
              <div className="space-y-2">
                {dayGroups.map((group, i) => (
                  <div
                    key={group.key}
                    className="animate-fade-slide-in"
                    style={{ animationDelay: `${240 + i * 55}ms` }}
                  >
                    <LeaderboardMatchDayGroup
                      group={group}
                      isOpen={openDayKey === group.key}
                      onToggle={() => toggleDay(group.key)}
                      onViewStats={onViewStats}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="animate-fade-slide-in text-sm text-slate-500" style={{ animationDelay: '240ms' }}>
                No match predictions yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
