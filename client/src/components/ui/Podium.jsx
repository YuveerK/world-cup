import { Crown } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';

const PODIUM_STYLES = {
  1: {
    ring: 'ring-amber-400',
    avatar: 'from-amber-300 to-yellow-500 text-blue-950',
    block: 'from-amber-400/90 to-yellow-500/80 h-28 lg:h-40',
    accent: 'text-amber-500',
  },
  2: {
    ring: 'ring-slate-300',
    avatar: 'from-slate-200 to-slate-400 text-slate-800',
    block: 'from-slate-300/80 to-slate-400/60 h-20 lg:h-28',
    accent: 'text-slate-500',
  },
  3: {
    ring: 'ring-orange-300',
    avatar: 'from-orange-300 to-amber-600 text-blue-950',
    block: 'from-orange-400/80 to-amber-600/60 h-16 lg:h-20',
    accent: 'text-orange-500',
  },
};

function getInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PodiumCard({ row, isCurrentUser, onSelect }) {
  const rank = row.selectedRank ?? row.rank;
  const style = PODIUM_STYLES[rank] || PODIUM_STYLES[3];
  const isChampion = rank === 1;

  const inner = (
    <>
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
      <p className={`text-center text-2xl font-black ${style.accent}`}>{roundPoints(row.total)}</p>
      <p className="mb-2 text-center text-[11px] font-medium text-slate-400">{row.predictions_count || 0} picks</p>
      {isCurrentUser && (
        <span className="mb-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
          You
        </span>
      )}
      <div className={`flex w-full items-start justify-center rounded-t-lg bg-gradient-to-b ${style.block} pt-2`}>
        <span className="text-lg font-black text-blue-950/80">{rank}</span>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(row.username)}
        className="flex w-1/3 max-w-[180px] flex-col items-center transition hover:opacity-80"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex w-1/3 max-w-[180px] flex-col items-center">
      {inner}
    </div>
  );
}

export function Podium({ rows, currentUser, onSelect }) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return null;

  const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="panel px-4 py-7 sm:px-8 lg:py-10">
      <div className="flex items-end justify-center gap-2 sm:gap-5">
        {ordered.map((row) => (
          <PodiumCard
            key={row.id || row.username}
            row={row}
            isCurrentUser={row.username === currentUser?.username}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
