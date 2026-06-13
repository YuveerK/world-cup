import { CalendarRange } from 'lucide-react';

function dayChipLabel(date) {
  if (!date) return { weekday: 'TBC', day: '–', month: '' };
  return {
    weekday: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date),
  };
}

export function MatchDayNav({ days, activeDay, onSelect, totalCount }) {
  if (!days.length) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        type="button"
        onClick={() => onSelect('ALL')}
        className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-4 py-2 transition ${
          activeDay === 'ALL'
            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-slate-900'
        }`}
      >
        <CalendarRange className="mb-0.5 h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide">All</span>
        <span className={`text-[10px] font-medium ${activeDay === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
          {totalCount} matches
        </span>
      </button>

      {days.map((group) => {
        const isActive = group.key === activeDay;
        const { weekday, day, month } = dayChipLabel(group.date);
        const hasLive = group.hasLive;

        return (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelect(group.key)}
            className={`relative flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 transition ${
              isActive
                ? hasLive
                  ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                  : 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : hasLive
                  ? 'border-rose-200 bg-white text-slate-700 hover:border-rose-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
            }`}
          >
            {hasLive && (
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isActive ? 'bg-white' : 'bg-rose-500'} opacity-70`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500'}`} />
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? (hasLive ? 'text-rose-100' : 'text-blue-100') : 'text-slate-400'}`}>
              {weekday}
            </span>
            <span className="text-lg font-black leading-none">{day}</span>
            <span className={`text-[10px] font-semibold uppercase ${isActive ? (hasLive ? 'text-rose-100' : 'text-blue-100') : 'text-slate-400'}`}>
              {month}
            </span>
            <span className={`mt-0.5 rounded-full px-1.5 text-[10px] font-bold ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {group.matches.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
