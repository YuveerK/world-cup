import { roundPoints } from '@/lib/utils/number';
import { RankBadge } from './RankBadge';
import { RankDelta } from './RankDelta';

export function StandingsRow({ row, isCurrentUser, isSelected, onSelect }) {
  const earnedPills = [
    { label: 'HT', value: row.ht_pts, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'FT', value: row.ft_pts, cls: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Closest', value: row.closest_pts, cls: 'border-violet-200 bg-violet-50 text-violet-700' },
    { label: 'Outcome', value: row.outcome_pts, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Winner', value: row.winner_pts, cls: 'border-rose-200 bg-rose-50 text-rose-700' },
  ].filter(({ value }) => roundPoints(value || 0) > 0);

  return (
    <button
      type="button"
      onClick={() => onSelect(row.username)}
      className={`group w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
        isSelected
          ? 'border-emerald-300 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/70 ring-2 ring-emerald-100'
          : isCurrentUser
          ? 'border-amber-200 bg-gradient-to-br from-white via-amber-50/50 to-white hover:border-amber-300 hover:shadow-sm'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <RankBadge rank={row.selectedRank} />
          <RankDelta value={row.rankChange} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-black text-slate-950">{row.username}</p>
            {isCurrentUser && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">You</span>
            )}
          </div>
          {earnedPills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {earnedPills.map(({ label, value, cls }) => (
                <span key={label} className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${cls}`}>
                  {label} {roundPoints(value || 0)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {row.selectedDayTotal > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Today</p>
              <p className="text-lg font-black text-emerald-600">+{row.selectedDayTotal}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-lg font-black text-slate-950">{roundPoints(row.total)}</p>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-emerald-100 bg-emerald-50/70 px-4 py-1.5 text-[11px] font-bold text-emerald-700">
          Analysis open →
        </div>
      )}
    </button>
  );
}
