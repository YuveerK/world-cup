import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { LeaderboardMatchRow } from './LeaderboardMatchRow';

function getDayBadgeClass(pts) {
  if (!pts || pts <= 0) return 'bg-gray-100 text-gray-400';
  if (pts >= 20) return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
}

export function LeaderboardMatchDayGroup({ group, isOpen, onToggle, onViewStats }) {
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    if (isOpen) setContentKey((k) => k + 1);
  }, [isOpen]);

  const dayTotal = roundPoints(
    group.items.reduce((sum, { entry }) => sum + (entry.match_total || 0), 0)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        className="w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {group.date ? formatDayHeading(group.date) : 'Date TBC'}
          </p>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-black tabular-nums ${getDayBadgeClass(dayTotal)}`}>
              {dayTotal > 0 ? `+${dayTotal}` : '0'} pts
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-1.5 border-t border-slate-200 p-2" key={contentKey}>
            {group.items.map(({ entry, match }, i) => (
              <div
                key={entry.match_id}
                className="animate-fade-slide-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <LeaderboardMatchRow
                  entry={entry}
                  match={match}
                  onViewStats={onViewStats}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
